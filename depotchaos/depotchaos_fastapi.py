#!/usr/bin/env python3
"""
DepotChaos Web Interface - FastAPI Backend
Serves database content to web frontend
"""

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import sqlite3
import json
from pathlib import Path
from datetime import datetime
from typing import Optional
import uuid
import uvicorn
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Import SendGrid sender
try:
    from sendgrid_sender import send_single_email, process_email_queue, get_status as get_sendgrid_status
    SENDGRID_AVAILABLE = True
except ImportError:
    SENDGRID_AVAILABLE = False
    print("WARNING: sendgrid_sender not available, falling back to SMTP")

# Pydantic model for email queue requests
class QueueEmailRequest(BaseModel):
    recipient_email: str
    subject: str
    body: str
    lead_id: Optional[int] = None
    scheduled_time: Optional[str] = None
    campaign: Optional[str] = None
    from_name: Optional[str] = "Miles"
    from_email: Optional[str] = "miles@myl0nr0s.cloud"

app = FastAPI(title="DepotChaos CRM", version="1.1.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database paths
DEPOT_CHAOS_DB = "/root/.openclaw/workspace/data/depot_chaos/unified.db"
DATADEPOT_DIR = Path("/root/.openclaw/workspace/datadepot")
STATIC_DIR = "/var/www/psdepot.com/depotchaos"

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DEPOT_CHAOS_DB)
    conn.row_factory = sqlite3.Row  # Return dict-like rows
    return conn

def row_to_dict(row):
    """Convert sqlite row to dict with enrichment parsing"""
    result = {key: row[key] for key in row.keys()}
    
    # Parse enrichment_data JSON if present
    if result.get('enrichment_data'):
        try:
            enrichment = json.loads(result['enrichment_data'])
            result['enrichment'] = enrichment
            # Flatten for easier frontend access
            result['contact_name'] = enrichment.get('contact_name', '')
            result['contact_title'] = enrichment.get('contact_title', '')
            result['phone'] = enrichment.get('phone', '')
            result['email'] = enrichment.get('email', '')
            result['city'] = enrichment.get('city', '')
        except:
            result['enrichment'] = {}
    
    return result

# Mount static files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
async def index():
    """Serve the main web interface"""
    return FileResponse(f"{STATIC_DIR}/index.html")

# ===== API ENDPOINTS =====

@app.get("/api/stats")
async def get_stats():
    """Get overall database statistics"""
    conn = get_db_connection()
    c = conn.cursor()
    
    stats = {}
    
    # Total leads (exclude deleted)
    c.execute("SELECT COUNT(*) FROM leads WHERE deleted = 0")
    stats['total_leads'] = c.fetchone()[0]
    
    # DataDepot-specific leads (exclude deleted)
    c.execute("SELECT COUNT(*) FROM leads WHERE pos_system IS NOT NULL AND deleted = 0")
    stats['datadepot_leads'] = c.fetchone()[0]
    
    # By status (exclude deleted)
    c.execute("SELECT status, COUNT(*) FROM leads WHERE deleted = 0 GROUP BY status")
    stats['by_status'] = dict(c.fetchall())
    
    # By tier (exclude deleted)
    c.execute("SELECT tier, COUNT(*) FROM leads WHERE tier IS NOT NULL AND deleted = 0 GROUP BY tier")
    stats['by_tier'] = dict(c.fetchall())
    
    # Intelligence records
    c.execute("SELECT COUNT(*) FROM datadepot_intelligence")
    stats['intelligence_records'] = c.fetchone()[0]
    
    # Today's activity (exclude deleted)
    today = datetime.now().strftime('%Y-%m-%d')
    c.execute("SELECT COUNT(*) FROM leads WHERE DATE(created_at) = ? AND deleted = 0", (today,))
    stats['new_today'] = c.fetchone()[0]
    
    conn.close()
    
    return stats

@app.get("/api/leads")
async def get_leads(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    tier: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    datadepot: bool = Query(False),
    sort_by: Optional[str] = Query(None),
    sort_dir: Optional[str] = Query("asc")
):
    """Get leads with filtering and pagination"""
    conn = get_db_connection()
    c = conn.cursor()
    
    # Build query
    where_clauses = ["deleted = 0"]  # Exclude soft-deleted records by default
    params = []

    if status:
        where_clauses.append("status = ?")
        params.append(status)
    
    if tier:
        where_clauses.append("tier = ?")
        params.append(tier)
    
    if source:
        where_clauses.append("source_type = ?")
        params.append(source)
    
    if state:
        # Support multiple states separated by comma (e.g., "CA,TX,AZ")
        states = [s.strip() for s in state.split(',')]
        if len(states) == 1:
            where_clauses.append("(state = ? OR county LIKE ?)")
            params.extend([state, f'%{state}%'])
        else:
            placeholders = ','.join(['?' for _ in states])
            where_clauses.append(f"(state IN ({placeholders}) OR county LIKE ?)")
            params.extend(states + [f'%{state}%'])
    
    if search:
        where_clauses.append("(business_name LIKE ? OR company_name LIKE ? OR county LIKE ? OR pos_system LIKE ? OR enrichment_data LIKE ? OR contact_name LIKE ?)")
        params.extend([f'%{search}%', f'%{search}%', f'%{search}%', f'%{search}%', f'%{search}%', f'%{search}%'])
    
    if datadepot:
        where_clauses.append("pos_system IS NOT NULL")
    
    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
    
    # Get total count
    count_sql = f"SELECT COUNT(*) FROM leads WHERE {where_sql}"
    c.execute(count_sql, params)
    total = c.fetchone()[0]
    
    # Build ORDER BY clause - support both frontend and legacy field names
    allowed_sort_fields = ['business_name', 'company_name', 'county', 'city', 'state', 'status', 'tier', 'pos_system', 'replacement_score', 'created_at', 'contact_name']
    order_by = "created_at DESC"  # default
    
    # Map frontend field names to DB columns
    field_map = {
        'business_name': 'business_name',
        'company_name': 'company_name',
        'state': 'state',
        'status': 'status',
        'tier': 'tier',
        'replacement_score': 'replacement_score',
        'county': 'county',
        'city': 'city',
        'pos_system': 'pos_system',
        'created_at': 'created_at',
        'contact_name': 'contact_name'
    }
    
    if sort_by and sort_by in allowed_sort_fields:
        direction = "DESC" if sort_dir and sort_dir.lower() == "desc" else "ASC"
        db_field = field_map.get(sort_by, sort_by)
        # Handle NULLs - put them at the end
        order_by = f"{db_field} IS NULL, {db_field} {direction}"
    
    # Get paginated results
    offset = (page - 1) * per_page
    query_sql = f"""
        SELECT * FROM leads 
        WHERE {where_sql}
        ORDER BY {order_by}
        LIMIT ? OFFSET ?
    """
    c.execute(query_sql, params + [per_page, offset])
    
    leads = [dict(row) for row in c.fetchall()]
    
    conn.close()
    
    return {
        'leads': leads,
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': (total + per_page - 1) // per_page
    }

@app.post("/api/leads")
async def create_lead(data: dict):
    """Create a new lead"""
    import uuid
    from datetime import datetime
    
    conn = get_db_connection()
    c = conn.cursor()
    
    # Extract fields with defaults - support both business_name and company_name
    business_name = data.get('business_name') or data.get('company_name', '')
    company_name = business_name  # Keep both fields in sync
    county = data.get('county') or data.get('city', '')
    city = data.get('city', '')
    state = data.get('state', '')
    zip_code = data.get('zip', '')
    status = data.get('status', 'new')
    tier = data.get('tier', 'Tier 2')
    pos_system = data.get('pos_system') or data.get('posSystem', '')
    source_type = data.get('source_type') or data.get('source', 'manual_entry')
    
    # Contact fields
    contact_name = data.get('contact_name', '')
    contact_title = data.get('contact_title', '')
    phone = data.get('phone', '')
    email = data.get('email', '')
    
    # Scoring fields
    replacement_score = data.get('replacement_score')
    pos_confidence = data.get('pos_confidence')
    equipment_age = data.get('equipment_age', '')
    review_sentiment = data.get('review_sentiment', '')
    pos_mentions = data.get('pos_mentions')
    
    # Build enrichment data from any extra fields
    enrichment = {}
    for key in ['address', 'notes', 'source_id', 'converted_at']:
        if key in data and data[key]:
            enrichment[key] = data[key]
    
    # Handle enrichment_data if passed as dict or needs merging
    if 'enrichment_data' in data and isinstance(data['enrichment_data'], dict):
        enrichment.update(data['enrichment_data'])
    elif 'enrichment' in data and isinstance(data['enrichment'], dict):
        enrichment.update(data['enrichment'])
    
    enrichment_json = json.dumps(enrichment) if enrichment else None
    
    # Generate ID - use AUTOINCREMENT for proper counting
    lead_id = data.get('id')
    if not lead_id:
        # Let SQLite auto-generate the ID
        c.execute("SELECT MAX(id) + 1 FROM leads")
        result = c.fetchone()[0]
        lead_id = result if result else 1
    
    try:
        c.execute("""
            INSERT INTO leads (
                id, business_name, company_name, county, city, state, zip,
                contact_name, contact_title, phone, email,
                status, tier, pos_system, pos_confidence, equipment_age,
                replacement_score, review_sentiment, pos_mentions,
                source_type, enrichment_data, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            lead_id, business_name, company_name, county, city, state, zip_code,
            contact_name, contact_title, phone, email,
            status, tier, pos_system, pos_confidence, equipment_age,
            replacement_score, review_sentiment, pos_mentions,
            source_type, enrichment_json,
            datetime.now().isoformat()
        ))
        conn.commit()
        
        # Get the new lead count for confirmation
        c.execute("SELECT COUNT(*) FROM leads WHERE deleted = 0")
        new_total = c.fetchone()[0]
        
        conn.close()
        
        return {
            'success': True,
            'id': lead_id,
            'total_leads': new_total,
            'message': f'Lead "{business_name}" created successfully'
        }
    except sqlite3.IntegrityError as e:
        conn.close()
        return JSONResponse(
            status_code=409,
            content={'success': False, 'error': 'Lead with this name/city/state already exists', 'detail': str(e)}
        )
    except Exception as e:
        conn.close()
        return JSONResponse(
            status_code=500,
            content={'success': False, 'error': 'Failed to create lead', 'detail': str(e)}
        )

@app.get("/api/leads/{lead_id}")
async def get_lead(lead_id: str):
    """Get single lead details with enrichment"""
    conn = get_db_connection()
    c = conn.cursor()
    
    c.execute("SELECT * FROM leads WHERE id = ? AND deleted = 0", (lead_id,))
    row = c.fetchone()
    
    conn.close()
    
    if row:
        return row_to_dict(row)
    else:
        return JSONResponse(status_code=404, content={'error': 'Lead not found'})

@app.put("/api/leads/{lead_id}")
async def update_lead(lead_id: str, data: dict):
    """Update lead information and enrichment data"""
    conn = get_db_connection()
    c = conn.cursor()
    
    # Build update query
    allowed_fields = ['status', 'assigned_agent', 'tier', 'pos_system', 
                      'email_sent', 'email_opened', 'email_clicked', 'demo_scheduled',
                      'contact_name', 'contact_title', 'phone', 'email', 
                      'callback_date', 'callback_notes',
                      'contact_count', 'abc_converted_at', 'contact_history',
                      'is_customer', 'customer_since', 'deleted', 'deleted_at']
    
    updates = []
    params = []
    
    for field in allowed_fields:
        if field in data:
            updates.append(f"{field} = ?")
            params.append(data[field])
    
    # Handle enrichment_data separately
    if 'enrichment_data' in data:
        # Get existing enrichment
        c.execute("SELECT enrichment_data FROM leads WHERE id = ?", (lead_id,))
        row = c.fetchone()
        existing = {}
        if row and row[0]:
            try:
                existing = json.loads(row[0])
            except:
                pass
        
        # Merge new enrichment
        try:
            new_enrichment = json.loads(data['enrichment_data'])
            existing.update(new_enrichment)
            updates.append("enrichment_data = ?")
            params.append(json.dumps(existing))
        except:
            pass
    
    if updates:
        params.append(lead_id)
        sql = f"UPDATE leads SET {', '.join(updates)} WHERE id = ?"
        c.execute(sql, params)
        
    conn.commit()
    updated = c.rowcount
    conn.close()
    
    return {'success': True, 'updated': updated}

@app.delete("/api/leads/{lead_id}")
async def delete_lead(lead_id: str, hard: bool = Query(False)):
    """Soft or hard delete a lead"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if hard:
        # Permanent deletion
        c.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
    else:
        # Soft delete - mark as deleted
        c.execute(
            "UPDATE leads SET deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
            (lead_id,)
        )
    
    conn.commit()
    deleted = c.rowcount
    conn.close()
    
    return {'success': True, 'deleted': deleted, 'hard_delete': hard}

@app.delete("/api/intelligence/{record_id}")
async def delete_intelligence_record(record_id: int):
    """Delete an intelligence record"""
    conn = get_db_connection()
    c = conn.cursor()
    
    c.execute("DELETE FROM datadepot_intelligence WHERE id = ?", (record_id,))
    
    conn.commit()
    deleted = c.rowcount
    conn.close()
    
    if deleted > 0:
        return {'success': True, 'deleted': deleted, 'message': 'Record deleted'}
    else:
        return JSONResponse(status_code=404, content={'error': 'Record not found'})

@app.get("/api/intelligence/{record_id}")
async def get_intelligence_detail(record_id: int):
    """Get single intelligence record details"""
    conn = get_db_connection()
    c = conn.cursor()
    
    c.execute("SELECT * FROM datadepot_intelligence WHERE id = ?", (record_id,))
    row = c.fetchone()
    
    conn.close()
    
    if row:
        return row_to_dict(row)
    else:
        return JSONResponse(status_code=404, content={'error': 'Record not found'})

@app.put("/api/intelligence/{record_id}")
async def update_intelligence(record_id: int, data: dict):
    """Update intelligence record"""
    conn = get_db_connection()
    c = conn.cursor()
    
    # Build update query
    allowed_fields = ['pos_system', 'pos_confidence', 'replacement_score', 'status',
                      'contact_name', 'contact_title', 'phone', 'email']
    
    updates = []
    params = []
    
    for field in allowed_fields:
        if field in data:
            updates.append(f"{field} = ?")
            params.append(data[field])
    
    if not updates:
        return JSONResponse(status_code=400, content={'error': 'No valid fields to update'})
    
    params.append(record_id)
    
    sql = f"UPDATE datadepot_intelligence SET {', '.join(updates)} WHERE id = ?"
    c.execute(sql, params)
    
    conn.commit()
    conn.close()
    
    return {'success': True, 'updated': c.rowcount}

@app.get("/api/intelligence")
async def get_intelligence(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    county: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    pos_system: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None),
    sort_order: Optional[str] = Query('asc')
):
    """Get CA ABC intelligence data with filtering and sorting"""
    conn = get_db_connection()
    c = conn.cursor()
    
    where_clauses = ["1=1"]
    params = []
    
    if county:
        where_clauses.append("county = ?")
        params.append(county)
    
    if city:
        where_clauses.append("city LIKE ?")
        params.append(f'%{city}%')
    
    if pos_system:
        if pos_system == 'Unknown':
            where_clauses.append("(pos_system IS NULL OR pos_system = '' OR pos_system = 'Unknown')")
        else:
            where_clauses.append("pos_system = ?")
            params.append(pos_system)
    
    if search:
        where_clauses.append("(business_name LIKE ? OR city LIKE ? OR address LIKE ? OR owner_name LIKE ?)")
        params.extend([f'%{search}%', f'%{search}%', f'%{search}%', f'%{search}%'])
    
    where_sql = " AND ".join(where_clauses)
    
    # Get total
    c.execute(f"SELECT COUNT(*) FROM datadepot_intelligence WHERE {where_sql}", params)
    total = c.fetchone()[0]
    
    # Determine sort order
    valid_sort_fields = ['business_name', 'city', 'state', 'county', 'phone', 'owner_name', 
                         'license_status', 'pos_system', 'replacement_score', 'issue_date']
    
    if sort_by and sort_by in valid_sort_fields:
        order_direction = 'DESC' if sort_order.lower() == 'desc' else 'ASC'
        # Handle NULL values - put them at the end
        order_by = f"{sort_by} IS NULL, {sort_by} {order_direction}"
    else:
        # Default sort
        order_by = "replacement_score DESC, county"
    
    # Get data
    offset = (page - 1) * per_page
    c.execute(f"""
        SELECT * FROM datadepot_intelligence
        WHERE {where_sql}
        ORDER BY {order_by}
        LIMIT ? OFFSET ?
    """, params + [per_page, offset])
    
    records = [dict(row) for row in c.fetchall()]
    
    # Parse JSON data field to extract actual business info
    for record in records:
        if record.get('data'):
            try:
                data_json = json.loads(record['data'])
                # Extract actual business name from license data
                if 'owner_name' in data_json:
                    record['owner_name'] = data_json['owner_name']
                if 'address' in data_json:
                    record['address'] = data_json['address']
                if 'city' in data_json:
                    record['city'] = data_json['city']
                if 'state' in data_json:
                    record['state'] = data_json['state']
                if 'zip' in data_json:
                    record['zip'] = data_json['zip']
                if 'phone' in data_json:
                    record['phone'] = data_json['phone']
                if 'issue_date' in data_json:
                    record['issue_date'] = data_json['issue_date']
                if 'expiration_date' in data_json:
                    record['expiration_date'] = data_json['expiration_date']
                if 'license_type_name' in data_json:
                    record['license_type_name'] = data_json['license_type_name']
                if 'status' in data_json:
                    record['license_status'] = data_json['status']
                # Use DBA if available, otherwise keep original business_name
                if 'dba' in data_json and data_json['dba']:
                    record['business_name'] = data_json['dba']
                elif 'business_name' in data_json and data_json['business_name']:
                    record['business_name'] = data_json['business_name']
            except json.JSONDecodeError:
                pass  # Keep original if JSON parsing fails
    
    conn.close()
    
    return {
        'records': records,
        'total': total,
        'page': page,
        'per_page': per_page
    }

@app.get("/api/cities/intelligence")
async def get_intelligence_cities():
    """Get list of all unique cities in intelligence data"""
    conn = get_db_connection()
    c = conn.cursor()
    
    # Get distinct cities from intelligence table
    c.execute("SELECT DISTINCT city FROM datadepot_intelligence WHERE city IS NOT NULL AND city != '' ORDER BY city")
    cities = [row[0] for row in c.fetchall()]
    
    # Also get counts per city
    c.execute("SELECT city, COUNT(*) FROM datadepot_intelligence WHERE city IS NOT NULL AND city != '' GROUP BY city ORDER BY city")
    city_counts = dict(c.fetchall())
    
    conn.close()
    
    return {
        'cities': cities,
        'city_counts': city_counts,
        'total_cities': len(cities)
    }

@app.get("/api/counties")
async def get_counties():
    """Get list of all counties with counts"""
    conn = get_db_connection()
    c = conn.cursor()
    
    # From leads (exclude deleted)
    c.execute("SELECT county, COUNT(*) FROM leads WHERE county IS NOT NULL AND deleted = 0 GROUP BY county ORDER BY COUNT(*) DESC")
    lead_counties = dict(c.fetchall())
    
    # From intelligence
    c.execute("SELECT county, COUNT(*) FROM datadepot_intelligence WHERE county IS NOT NULL GROUP BY county ORDER BY COUNT(*) DESC")
    intel_counties = dict(c.fetchall())
    
    conn.close()
    
    return {
        'lead_counties': lead_counties,
        'intelligence_counties': intel_counties
    }

@app.get("/api/pos-systems")
async def get_pos_systems():
    """Get breakdown by POS system"""
    conn = get_db_connection()
    c = conn.cursor()
    
    c.execute("""
        SELECT pos_system, COUNT(*), AVG(replacement_score) 
        FROM leads 
        WHERE pos_system IS NOT NULL AND deleted = 0
        GROUP BY pos_system
    """)
    
    systems = [{'name': row[0], 'count': row[1], 'avg_score': row[2]} for row in c.fetchall()]
    
    conn.close()
    
    return systems

@app.get("/api/filters/leads")
async def get_leads_filters():
    """Get all distinct filter values for leads"""
    conn = get_db_connection()
    c = conn.cursor()
    
    # Get distinct states from leads
    c.execute("SELECT DISTINCT state FROM leads WHERE state IS NOT NULL AND state != '' AND deleted = 0 ORDER BY state")
    states = [row[0] for row in c.fetchall()]
    
    # Get distinct status values
    c.execute("SELECT DISTINCT status FROM leads WHERE status IS NOT NULL AND status != '' AND deleted = 0 ORDER BY status")
    statuses = [row[0] for row in c.fetchall()]
    
    # Get distinct tier values
    c.execute("SELECT DISTINCT tier FROM leads WHERE tier IS NOT NULL AND tier != '' AND deleted = 0 ORDER BY tier")
    tiers = [row[0] for row in c.fetchall()]
    
    # Get distinct POS systems from leads
    c.execute("SELECT DISTINCT pos_system FROM leads WHERE pos_system IS NOT NULL AND pos_system != '' AND deleted = 0 ORDER BY pos_system")
    pos_systems = [row[0] for row in c.fetchall()]
    
    conn.close()
    
    return {
        'states': states,
        'statuses': statuses,
        'tiers': tiers,
        'pos_systems': pos_systems
    }

@app.get("/api/filters/intelligence")
async def get_intelligence_filters():
    """Get all distinct filter values for intelligence"""
    conn = get_db_connection()
    c = conn.cursor()
    
    # Get distinct POS systems from intelligence
    c.execute("SELECT DISTINCT pos_system FROM datadepot_intelligence WHERE pos_system IS NOT NULL AND pos_system != '' ORDER BY pos_system")
    pos_systems = [row[0] for row in c.fetchall()]
    
    # Get distinct license types
    c.execute("SELECT DISTINCT license_type FROM datadepot_intelligence WHERE license_type IS NOT NULL AND license_type != '' ORDER BY license_type")
    license_types = [row[0] for row in c.fetchall()]
    
    conn.close()
    
    return {
        'pos_systems': pos_systems,
        'license_types': license_types
    }

@app.get("/api/filters/enrichment")
async def get_enrichment_filters():
    """Get all distinct filter values for enrichment (vendors)"""
    conn = get_depot_chaos_db()
    c = conn.cursor()
    
    # Get distinct states from vendors (2-char codes only)
    c.execute("SELECT DISTINCT state FROM vendors WHERE state IS NOT NULL AND state != '' AND LENGTH(state) = 2 ORDER BY state")
    states = [row[0] for row in c.fetchall()]
    
    # Get distinct status values
    c.execute("SELECT DISTINCT status FROM vendors WHERE status IS NOT NULL AND status != '' ORDER BY status")
    statuses = [row[0] for row in c.fetchall()]
    
    # Get distinct cities
    c.execute("SELECT DISTINCT city FROM vendors WHERE city IS NOT NULL AND city != '' ORDER BY city")
    cities = [row[0] for row in c.fetchall()]
    
    # Check if we have any enriched vendors (notes containing 'Yelp Enriched')
    c.execute("SELECT COUNT(*) FROM vendors WHERE notes LIKE '%Yelp Enriched%'")
    enriched_count = c.fetchone()[0]
    
    conn.close()
    
    # Build status options: include real statuses + derived filters
    status_options = list(statuses)  # Start with real DB statuses
    
    # Add 'enriched' filter if vendors exist with Yelp data
    if enriched_count > 0 and 'enriched' not in status_options:
        status_options.append('enriched')
    
    # Always add 'contacted' filter (checks last_contact_at field)
    if 'contacted' not in status_options:
        status_options.append('contacted')
    
    return {
        'states': states,
        'statuses': status_options,
        'cities': cities
    }

@app.post("/api/queue")
async def add_email_to_queue(request: QueueEmailRequest):
    """Add a new email to the queue"""
    queue_file = DATADEPOT_DIR / 'queue' / 'pending_emails.json'
    
    # Ensure queue directory exists
    queue_file.parent.mkdir(parents=True, exist_ok=True)
    
    # Load existing queue or create new
    queue = []
    if queue_file.exists():
        try:
            with open(queue_file, 'r') as f:
                queue = json.load(f)
        except:
            queue = []
    
    # Create email entry
    email_id = str(uuid.uuid4())
    email_entry = {
        'id': email_id,
        'to_email': request.recipient_email,
        'subject': request.subject,
        'body': request.body,
        'lead_id': request.lead_id,
        'campaign_id': request.campaign or 'outreach',
        'scheduled_time': request.scheduled_time,
        'from_name': request.from_name,
        'from_email': request.from_email,
        'status': 'pending',
        'created_at': datetime.now().isoformat()
    }
    
    # Add to queue
    queue.append(email_entry)
    
    # Save queue
    with open(queue_file, 'w') as f:
        json.dump(queue, f, indent=2)
    
    return {
        'success': True,
        'email_id': email_id,
        'message': 'Email added to queue',
        'queue_position': len(queue)
    }

@app.get("/api/queue")
async def get_email_queue():
    """Get pending email queue with SendGrid status"""
    import uuid
    queue_file = DATADEPOT_DIR / 'queue' / 'pending_emails.json'
    
    if not queue_file.exists():
        return {'queue': [], 'total': 0, 'ready_to_send': 0, 'scheduled': 0, 'sent_today': 0}
    
    with open(queue_file, 'r') as f:
        queue = json.load(f)
    
    # Ensure all emails have IDs and status
    for email in queue:
        if 'id' not in email:
            email['id'] = str(uuid.uuid4())
        if 'status' not in email:
            email['status'] = 'pending'
    
    # Save back with IDs and status
    with open(queue_file, 'w') as f:
        json.dump(queue, f, indent=2)
    
    now = datetime.now()
    ready = []
    scheduled = []
    
    for e in queue:
        scheduled_time = e.get('scheduled_time', '')
        if scheduled_time:
            try:
                sched = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00').replace('+00:00', ''))
                if sched <= now:
                    ready.append(e)
                else:
                    scheduled.append(e)
            except:
                ready.append(e)
        else:
            ready.append(e)
    
    # Count sent today
    sent_today = 0
    sent_file = DATADEPOT_DIR / 'queue' / 'sent_emails.json'
    if sent_file.exists():
        with open(sent_file, 'r') as f:
            sent = json.load(f)
        today = now.strftime('%Y-%m-%d')
        sent_today = len([s for s in sent if s.get('sent_at', '').startswith(today)])
    
    # Count failed today
    failed_today = 0
    failed_file = DATADEPOT_DIR / 'queue' / 'failed_emails.json'
    if failed_file.exists():
        with open(failed_file, 'r') as f:
            failed = json.load(f)
        today = now.strftime('%Y-%m-%d')
        failed_today = len([s for s in failed if s.get('failed_at', '').startswith(today)])
    
    # Get SendGrid status
    sendgrid_info = {}
    if SENDGRID_AVAILABLE:
        try:
            sendgrid_info = get_sendgrid_status()
        except Exception as e:
            sendgrid_info = {'error': str(e)}
    
    return {
        'queue': queue,
        'total': len(queue),
        'ready_to_send': len(ready),
        'scheduled': len(scheduled),
        'sent_today': sent_today,
        'failed_today': failed_today,
        'sendgrid': sendgrid_info
    }

@app.get("/api/sendgrid/status")
async def get_sendgrid_status_endpoint():
    """Get SendGrid configuration and queue status"""
    import os
    
    api_key = os.getenv('SENDGRID_API_KEY', '')
    
    status = {
        'configured': bool(api_key),
        'api_key_preview': api_key[:8] + '...' if len(api_key) > 10 else 'not set',
        'from_email': 'info@psdepot.com',
        'domain': 'psdepot.com'
    }
    
    if SENDGRID_AVAILABLE:
        try:
            queue_status = get_sendgrid_status()
            status.update(queue_status)
        except Exception as e:
            status['error'] = str(e)
    else:
        status['sendgrid_module'] = 'not available'
    
    return status

@app.get("/api/activities")
async def get_activities():
    """Get recent activities from logs"""
    activities = []
    
    # Check recent email sends
    sent_file = DATADEPOT_DIR / 'queue' / 'sent_emails.json'
    if sent_file.exists():
        with open(sent_file, 'r') as f:
            sent = json.load(f)
            activities.extend([{
                'type': 'email_sent',
                'description': f"Email sent to {e.get('to_email', 'unknown')}",
                'timestamp': e.get('sent_at', ''),
                'campaign': e.get('campaign_id', '')
            } for e in sent[-10:]])
    
    # Check recent email failures
    failed_file = DATADEPOT_DIR / 'queue' / 'failed_emails.json'
    if failed_file.exists():
        with open(failed_file, 'r') as f:
            failed = json.load(f)
            activities.extend([{
                'type': 'email_failed',
                'description': f"Email failed to {e.get('to_email', 'unknown')}",
                'timestamp': e.get('failed_at', ''),
                'campaign': e.get('campaign_id', '')
            } for e in failed[-10:]])
    
    # Sort by timestamp
    activities.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    
    return activities[:20]

@app.post("/api/queue/{email_id}/send")
async def send_email_now(email_id: str):
    """Send a queued email immediately via SendGrid with rate limiting"""
    import os
    import requests
    import uuid
    import time
    from pathlib import Path
    
    # Load queue
    queue_file = DATADEPOT_DIR / 'queue' / 'pending_emails.json'
    sent_file = DATADEPOT_DIR / 'queue' / 'sent_emails.json'
    failed_file = DATADEPOT_DIR / 'queue' / 'failed_emails.json'
    
    if not queue_file.exists():
        return JSONResponse(status_code=404, content={'error': 'Queue file not found'})
    
    with open(queue_file, 'r') as f:
        queue = json.load(f)
    
    # Find email by ID - generate stable IDs if missing (hash of content)
    email_to_send = None
    remaining_queue = []
    import hashlib
    for email in queue:
        if 'id' not in email:
            # Create stable ID from lead_id + to_email hash
            id_string = f"{email.get('lead_id', '0')}-{email.get('to_email', '')}-{email.get('campaign_id', '')}"
            email['id'] = hashlib.md5(id_string.encode()).hexdigest()[:16]
        if email.get('id') == email_id:
            email_to_send = email
        else:
            remaining_queue.append(email)
    
    if not email_to_send:
        return JSONResponse(status_code=404, content={'error': 'Email not found in queue', 'email_id': email_id})
    
    # Update queue with IDs
    with open(queue_file, 'w') as f:
        json.dump(queue, f, indent=2)
    
    # Use SendGrid if available, otherwise fallback to SMTP
    if SENDGRID_AVAILABLE:
        result = send_single_email(email_to_send)
        
        if result['success']:
            # Record as sent
            email_to_send['sent_at'] = datetime.now().isoformat()
            email_to_send['message_id'] = result['message_id']
            
            sent_list = []
            if sent_file.exists():
                with open(sent_file, 'r') as f:
                    sent_list = json.load(f)
            
            sent_list.append(email_to_send)
            
            with open(sent_file, 'w') as f:
                json.dump(sent_list, f, indent=2)
            
            # Update queue
            with open(queue_file, 'w') as f:
                json.dump(remaining_queue, f, indent=2)
            
            return {
                'success': True,
                'message': f'Email sent to {email_to_send["to_email"]} via SendGrid',
                'message_id': result['message_id'],
                'email_id': email_id
            }
        elif result.get('rate_limited'):
            return JSONResponse(status_code=429, content={
                'success': False,
                'error': result['error'],
                'retry_after': result.get('retry_after', 900),
                'email_id': email_id
            })
        else:
            # SendGrid failed - record as failed
            email_to_send['failed_at'] = datetime.now().isoformat()
            email_to_send['error'] = result['error']
            
            failed_list = []
            if failed_file.exists():
                with open(failed_file, 'r') as f:
                    failed_list = json.load(f)
            
            failed_list.append(email_to_send)
            
            with open(failed_file, 'w') as f:
                json.dump(failed_list, f, indent=2)
            
            # Remove from queue on failure
            with open(queue_file, 'w') as f:
                json.dump(remaining_queue, f, indent=2)
            
            return JSONResponse(status_code=500, content={
                'success': False,
                'error': result['error'],
                'email_id': email_id
            })
    
    # Fallback to SMTP if SendGrid not available
    SMTP_SERVER = 'smtp.hostinger.com'
    SMTP_PORT = 587
    SMTP_USER = 'miles@myl0nr0s.cloud'
    SMTP_PASS = os.getenv('SMTP_PASS', '')
    
    # Rate limiting configuration for SMTP fallback
    RATE_LIMIT_FILE = Path('/tmp/depotchaos_last_send.txt')
    MIN_DELAY_SECONDS = 300  # 5 minutes between sends
    
    now = time.time()
    if RATE_LIMIT_FILE.exists():
        try:
            last_send = float(RATE_LIMIT_FILE.read_text().strip())
            time_since_last = now - last_send
            if time_since_last < MIN_DELAY_SECONDS:
                wait_time = int(MIN_DELAY_SECONDS - time_since_last)
                return JSONResponse(status_code=429, content={
                    'success': False,
                    'error': f'Rate limit: Please wait {wait_time}s before sending another email.',
                    'retry_after': wait_time,
                    'email_id': email_id
                })
        except (ValueError, IOError):
            pass
    
    if not SMTP_PASS:
        # Test mode - simulate send
        email_to_send['sent_at'] = datetime.now().isoformat()
        email_to_send['test_mode'] = True
        email_to_send['message_id'] = f'test_{int(datetime.now().timestamp())}'
        
        sent_list = []
        if sent_file.exists():
            with open(sent_file, 'r') as f:
                sent_list = json.load(f)
        
        sent_list.append(email_to_send)
        with open(sent_file, 'w') as f:
            json.dump(sent_list, f, indent=2)
        
        with open(queue_file, 'w') as f:
            json.dump(remaining_queue, f, indent=2)
        
        RATE_LIMIT_FILE.write_text(str(now))
        
        return {
            'success': True,
            'test_mode': True,
            'message': f'Email to {email_to_send["to_email"]} simulated (TEST MODE)',
            'email_id': email_id
        }
    
    # SMTP send fallback
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = email_to_send.get('subject', 'Performance Supply Depot')
        msg['From'] = f'Miles - Performance Supply Depot <{SMTP_USER}>'
        msg['To'] = email_to_send['to_email']
        msg['Bcc'] = 'info@psdepot.com'
        msg['Reply-To'] = 'info@psdepot.com'
        
        message_id = f"<{uuid.uuid4()}@psdepot.com>"
        msg['Message-ID'] = message_id
        
        html_body = email_to_send.get('html_body', '')
        if not html_body:
            html_body = f"<html><body><pre>{email_to_send.get('body', '')}</pre></body></html>"
        
        msg.attach(MIMEText(html_body, 'html'))
        
        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls(context=context)
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        
        email_to_send['sent_at'] = datetime.now().isoformat()
        email_to_send['message_id'] = message_id
        
        sent_list = []
        if sent_file.exists():
            with open(sent_file, 'r') as f:
                sent_list = json.load(f)
        
        sent_list.append(email_to_send)
        with open(sent_file, 'w') as f:
            json.dump(sent_list, f, indent=2)
        
        with open(queue_file, 'w') as f:
            json.dump(remaining_queue, f, indent=2)
        
        RATE_LIMIT_FILE.write_text(str(time.time()))
        
        return {
            'success': True,
            'message': f'Email sent to {email_to_send["to_email"]}',
            'message_id': message_id,
            'email_id': email_id
        }
        
    except Exception as e:
        email_to_send['failed_at'] = datetime.now().isoformat()
        email_to_send['error'] = str(e)
        
        failed_list = []
        if failed_file.exists():
            with open(failed_file, 'r') as f:
                failed_list = json.load(f)
        
        failed_list.append(email_to_send)
        with open(failed_file, 'w') as f:
            json.dump(failed_list, f, indent=2)
        
        with open(queue_file, 'w') as f:
            json.dump(remaining_queue, f, indent=2)
        
        return JSONResponse(status_code=500, content={
            'success': False,
            'error': str(e),
            'email_id': email_id
        })

@app.post("/api/queue/{email_id}/cancel")
async def cancel_queued_email(email_id: str):
    """Cancel a queued email"""
    import uuid
    queue_file = DATADEPOT_DIR / 'queue' / 'pending_emails.json'
    
    if not queue_file.exists():
        return JSONResponse(status_code=404, content={'error': 'Queue file not found'})
    
    with open(queue_file, 'r') as f:
        queue = json.load(f)
    
    # Find and remove email - ensure all have IDs
    remaining = []
    found = False
    
    for email in queue:
        if 'id' not in email:
            email['id'] = str(uuid.uuid4())
        if email.get('id') == email_id:
            found = True
        else:
            remaining.append(email)
    
    if not found:
        return JSONResponse(status_code=404, content={'error': 'Email not found', 'email_id': email_id})
    
    # Update queue
    with open(queue_file, 'w') as f:
        json.dump(remaining, f, indent=2)
    
    return {
        'success': True,
        'message': f'Email {email_id} cancelled',
        'remaining_count': len(remaining)
    }

@app.get("/api/calendar")
async def get_calendar(year: int = Query(None), month: int = Query(None)):
    """Get scheduled callbacks for calendar view"""
    conn = get_db_connection()
    c = conn.cursor()
    
    # Build date filter
    params = []
    date_filter = ""
    if year and month:
        date_filter = "AND strftime('%Y-%m', callback_date) = ?"
        params.append(f"{year}-{month:02d}")
    
    c.execute(f"""
        SELECT id, business_name, company_name, contact_name, contact_title, phone, email, 
               callback_date, callback_notes, status
        FROM leads 
        WHERE callback_date IS NOT NULL {date_filter}
        ORDER BY callback_date ASC
    """, params)
    
    callbacks = []
    for row in c.fetchall():
        cb_date = row[7]
        # Use business_name as primary, fall back to company_name
        business_name = row[1] or row[2] or 'Unknown Business'
        callbacks.append({
            'lead_id': row[0],
            'company_name': business_name,
            'contact_name': row[3],
            'contact_title': row[4],
            'phone': row[5],
            'email': row[6],
            'callback_date': cb_date,
            'callback_time': cb_date[11:16] if cb_date else None,  # Extract HH:MM from ISO
            'callback_notes': row[8],
            'status': row[9]
        })
    
    conn.close()
    
    return {
        'year': year,
        'month': month,
        'total_callbacks': len(callbacks),
        'callbacks': callbacks
    }

# ===== ENRICHMENT API ENDPOINTS (DepotChaos vendors) =====

VENDOR_DB = "/root/.openclaw/workspace/DepotChaos/depot_chaos.db"
YELP_CACHE_FILE = "/root/.openclaw/workspace/DepotChaos/yelp_cache.json"

def get_depot_chaos_db():
    """Get DepotChaos database connection"""
    conn = sqlite3.connect(VENDOR_DB)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/api/enrichment")
async def get_enrichment_data(
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    """Get vendor enrichment data from DepotChaos"""
    conn = get_depot_chaos_db()
    c = conn.cursor()
    
    # Build query
    where_clauses = []
    params = []
    
    if search:
        where_clauses.append("(name LIKE ? OR dba_name LIKE ? OR contact_name LIKE ? OR phone LIKE ?)")
        params.extend([f'%{search}%', f'%{search}%', f'%{search}%', f'%{search}%'])
    
    if city:
        where_clauses.append("city = ?")
        params.append(city)
    
    if state:
        where_clauses.append("state = ?")
        params.append(state)
    
    if status:
        if status == 'enriched':
            where_clauses.append("notes LIKE '%Yelp Enriched%'")
        elif status == 'active':
            where_clauses.append("status = 'active'")
        elif status == 'contacted':
            where_clauses.append("last_contact_at IS NOT NULL")
    else:
        # Default: exclude promoted vendors
        where_clauses.append("status != 'promoted'")
    
    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
    
    # Get total count
    c.execute(f"SELECT COUNT(*) FROM vendors WHERE {where_sql}", params)
    total = c.fetchone()[0]
    
    # Get enriched count
    c.execute("SELECT COUNT(*) FROM vendors WHERE notes LIKE '%Yelp Enriched%'")
    enriched_count = c.fetchone()[0]
    
    # Get with phone count
    c.execute("SELECT COUNT(*) FROM vendors WHERE phone IS NOT NULL AND phone != ''")
    with_phone = c.fetchone()[0]
    
    # Get distinct cities for filter (filter out corrupted date values and empty entries)
    c.execute("SELECT DISTINCT city FROM vendors WHERE city IS NOT NULL AND TRIM(city) != '' AND city NOT LIKE '__-%' ORDER BY city")
    cities = [row[0] for row in c.fetchall() if row[0] and row[0].strip()]
    
    # Get paginated results
    offset = (page - 1) * per_page
    c.execute(f"""
        SELECT * FROM vendors 
        WHERE {where_sql}
        ORDER BY imported_at DESC
        LIMIT ? OFFSET ?
    """, params + [per_page, offset])
    
    vendors = [dict(row) for row in c.fetchall()]
    
    conn.close()
    
    return {
        'vendors': vendors,
        'total': total,
        'enriched_count': enriched_count,
        'with_phone': with_phone,
        'cities': cities,
        'page': page,
        'per_page': per_page
    }

@app.get("/api/enrichment/{vendor_id}")
async def get_vendor_detail(vendor_id: int):
    """Get single vendor details"""
    conn = get_depot_chaos_db()
    c = conn.cursor()
    
    c.execute("SELECT * FROM vendors WHERE id = ?", (vendor_id,))
    row = c.fetchone()
    
    conn.close()
    
    if row:
        return dict(row)
    else:
        return JSONResponse(status_code=404, content={'error': 'Vendor not found'})

@app.post("/api/enrichment/{vendor_id}/run")
async def run_single_enrichment(vendor_id: int):
    """Run Yelp enrichment for a single vendor"""
    import subprocess
    import sys
    
    # Get vendor info
    conn = get_depot_chaos_db()
    c = conn.cursor()
    c.execute("SELECT name, city, state FROM vendors WHERE id = ?", (vendor_id,))
    vendor = c.fetchone()
    conn.close()
    
    if not vendor:
        return JSONResponse(status_code=404, content={'error': 'Vendor not found'})
    
    # Run enrichment script for single vendor
    try:
        result = subprocess.run([
            sys.executable, 
            '/root/.openclaw/workspace/DepotChaos/yelp_enrichment.py',
            '--single', str(vendor_id)
        ], capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            return {
                'success': True,
                'message': f'Enriched: {vendor[0]}',
                'vendor_id': vendor_id
            }
        else:
            return {
                'success': False,
                'message': 'Not found on Yelp or enrichment failed',
                'vendor_id': vendor_id
            }
    except Exception as e:
        return JSONResponse(status_code=500, content={
            'success': False,
            'error': str(e),
            'vendor_id': vendor_id
        })

@app.post("/api/enrichment/run")
async def run_batch_enrichment(batch_size: int = Query(50, ge=1, le=100)):
    """Run Yelp enrichment batch"""
    import subprocess
    import sys
    
    try:
        result = subprocess.run([
            sys.executable,
            '/root/.openclaw/workspace/DepotChaos/yelp_enrichment.py',
            '--batch-size', str(batch_size)
        ], capture_output=True, text=True, timeout=300)
        
        # Parse output for counts
        output = result.stdout
        enriched = 0
        not_found = 0
        
        for line in output.split('\n'):
            if 'Enriched:' in line:
                try:
                    enriched = int(line.split(':')[1].strip())
                except:
                    pass
            if 'Not found:' in line:
                try:
                    not_found = int(line.split(':')[1].strip())
                except:
                    pass
        
        return {
            'success': True,
            'enriched': enriched,
            'not_found': not_found,
            'message': f'Enrichment complete: {enriched} enriched, {not_found} not found'
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={
            'success': False,
            'error': str(e)
        })

@app.put("/api/enrichment/{vendor_id}")
async def update_vendor(vendor_id: int, data: dict):
    """Update vendor information"""
    conn = get_depot_chaos_db()
    c = conn.cursor()
    
    allowed_fields = ['name', 'dba_name', 'contact_name', 'phone', 'email', 
                      'address', 'city', 'state', 'zip', 'vendor_type', 
                      'status', 'territory', 'notes']
    
    updates = []
    params = []
    
    for field in allowed_fields:
        if field in data:
            updates.append(f"{field} = ?")
            params.append(data[field])
    
    if not updates:
        return JSONResponse(status_code=400, content={'error': 'No valid fields to update'})
    
    params.append(vendor_id)
    sql = f"UPDATE vendors SET {', '.join(updates)} WHERE id = ?"
    c.execute(sql, params)
    
    conn.commit()
    updated = c.rowcount
    conn.close()
    
    return {'success': True, 'updated': updated, 'vendor_id': vendor_id}

@app.delete("/api/enrichment/{vendor_id}")
async def delete_vendor(vendor_id: int):
    """Delete a vendor from DepotChaos"""
    conn = get_depot_chaos_db()
    c = conn.cursor()
    
    c.execute("DELETE FROM vendors WHERE id = ?", (vendor_id,))
    deleted = c.rowcount
    
    conn.commit()
    conn.close()
    
    if deleted:
        return {'success': True, 'message': f'Vendor {vendor_id} deleted', 'vendor_id': vendor_id}
    else:
        return JSONResponse(status_code=404, content={'error': 'Vendor not found'})

@app.post("/api/enrichment/{vendor_id}/promote")
async def promote_vendor_to_lead(vendor_id: int, data: dict):
    """
    Promote enriched vendor to lead in unified database.
    If lead already exists, updates it with enriched data.
    Only marks vendor as promoted after successful lead creation/update.
    """
    # Get vendor data first
    vendor_conn = get_depot_chaos_db()
    vc = vendor_conn.cursor()
    vc.execute("SELECT * FROM vendors WHERE id = ?", (vendor_id,))
    vendor_row = vc.fetchone()
    vendor_conn.close()
    
    if not vendor_row:
        return JSONResponse(status_code=404, content={'error': 'Vendor not found'})
    
    vendor = dict(vendor_row)
    
    # Check if lead already exists in unified database
    lead_conn = get_db_connection()
    lc = lead_conn.cursor()
    
    business_name = vendor.get('name', '')
    city = vendor.get('city', '')
    state = vendor.get('state', '')
    
    lc.execute("""
        SELECT id FROM leads 
        WHERE business_name = ? AND city = ? AND state = ? AND deleted = 0
    """, (business_name, city, state))
    existing_lead = lc.fetchone()
    
    # Build enrichment data from vendor
    enrichment = {
        'dba': vendor.get('dba_name'),
        'address': vendor.get('address'),
        'zip': vendor.get('zip'),
        'vendor_id': vendor_id,
        'vendor_notes': vendor.get('notes'),
        'original_source': 'DepotChaos',
        'promoted_at': datetime.now().isoformat()
    }
    
    if existing_lead:
        # Update existing lead with enriched data
        lead_id = existing_lead[0]
        
        # Merge new enrichment with existing
        lc.execute("SELECT enrichment_data FROM leads WHERE id = ?", (lead_id,))
        existing_enrichment_row = lc.fetchone()
        existing_enrichment = {}
        if existing_enrichment_row and existing_enrichment_row[0]:
            try:
                existing_enrichment = json.loads(existing_enrichment_row[0])
            except:
                pass
        
        # Update with new data (new data takes precedence)
        existing_enrichment.update(enrichment)
        existing_enrichment['enrichment_history'] = existing_enrichment.get('enrichment_history', []) + [{
            'source': 'DepotChaos',
            'timestamp': datetime.now().isoformat(),
            'vendor_id': vendor_id
        }]
        
        # Update the lead
        updates = {
            'phone': vendor.get('phone') or existing_enrichment.get('phone'),
            'email': vendor.get('email') or existing_enrichment.get('email'),
            'contact_name': vendor.get('contact_name') or existing_enrichment.get('contact_name'),
            'enrichment_data': json.dumps(existing_enrichment),
            'source_type': 'DepotChaos_Enriched',
        }
        
        update_sql = "UPDATE leads SET " + ", ".join([f"{k} = ?" for k in updates.keys()]) + " WHERE id = ?"
        update_values = list(updates.values()) + [lead_id]
        lc.execute(update_sql, update_values)
        
        lead_conn.commit()
        action = 'updated'
        result_id = lead_id
    else:
        # Create new lead
        lead_data = {
            'business_name': business_name,
            'company_name': business_name,
            'county': city,
            'city': city,
            'state': state,
            'zip': vendor.get('zip', ''),
            'contact_name': vendor.get('contact_name', ''),
            'phone': vendor.get('phone', ''),
            'email': vendor.get('email', ''),
            'status': 'new',
            'tier': 'Tier 2',
            'source_type': 'DepotChaos_Enriched',
            'pos_system': '',
            'enrichment_data': json.dumps(enrichment),
            'created_at': datetime.now().isoformat()
        }
        
        columns = list(lead_data.keys())
        placeholders = ', '.join(['?' for _ in columns])
        sql = f"INSERT INTO leads ({', '.join(columns)}) VALUES ({placeholders})"
        lc.execute(sql, list(lead_data.values()))
        
        result_id = lc.lastrowid
        lead_conn.commit()
        action = 'created'
    
    lead_conn.close()
    
    # Only mark vendor as promoted AFTER successful lead creation/update
    vendor_conn = get_depot_chaos_db()
    vc = vendor_conn.cursor()
    vc.execute("""
        UPDATE vendors 
        SET status = 'promoted', 
            notes = COALESCE(notes, '') || ' | Promoted to Lead: ' || ? || ' (Lead ID: ' || ? || ')'
        WHERE id = ?
    """, (datetime.now().isoformat(), str(result_id), vendor_id))
    vendor_conn.commit()
    vendor_conn.close()
    
    return {
        'success': True,
        'message': f'Lead "{business_name}" {action} successfully',
        'vendor_id': vendor_id,
        'lead_id': result_id,
        'action': action
    }

@app.get("/api/queue/{email_id}/preview")
async def preview_queued_email(email_id: str):
    """Get email content for preview before sending"""
    import uuid
    queue_file = DATADEPOT_DIR / 'queue' / 'pending_emails.json'
    
    if not queue_file.exists():
        return JSONResponse(status_code=404, content={'error': 'Queue file not found'})
    
    with open(queue_file, 'r') as f:
        queue = json.load(f)
    
    # Find email by ID - generate stable IDs if missing
    import hashlib
    for email in queue:
        if 'id' not in email:
            id_string = f"{email.get('lead_id', '0')}-{email.get('to_email', '')}-{email.get('campaign_id', '')}"
            email['id'] = hashlib.md5(id_string.encode()).hexdigest()[:16]
        if email.get('id') == email_id:
            return {
                'success': True,
                'email': {
                    'id': email.get('id'),
                    'to_name': email.get('to_name', ''),
                    'to_email': email.get('to_email', ''),
                    'from': email.get('from', 'Miles - Performance Supply Depot <info@psdepot.com>'),
                    'subject': email.get('subject', ''),
                    'html_body': email.get('html_body', ''),
                    'text_body': email.get('text_body') or email.get('body', ''),
                    'template': email.get('template', 'unknown'),
                    'company_name': email.get('company_name', ''),
                    'scheduled_time': email.get('scheduled_time', ''),
                    'variables': email.get('variables', {}),
                    'campaign_id': email.get('campaign_id', ''),
                    'status': email.get('status', 'pending')
                }
            }
    
    return JSONResponse(status_code=404, content={'error': 'Email not found', 'email_id': email_id})

@app.get("/api/queue/{email_id}/status")
async def get_email_status(email_id: str):
    """Get current status of an email (pending, sent, failed, cancelled)"""
    import uuid
    
    # Check pending queue
    queue_file = DATADEPOT_DIR / 'queue' / 'pending_emails.json'
    if queue_file.exists():
        with open(queue_file, 'r') as f:
            queue = json.load(f)
        for email in queue:
            if email.get('id') == email_id:
                return {
                    'success': True,
                    'email_id': email_id,
                    'status': email.get('status', 'pending'),
                    'location': 'queue',
                    'scheduled_time': email.get('scheduled_time'),
                    'updated_at': email.get('updated_at')
                }
    
    # Check sent emails
    sent_file = DATADEPOT_DIR / 'queue' / 'sent_emails.json'
    if sent_file.exists():
        with open(sent_file, 'r') as f:
            sent = json.load(f)
        for email in sent:
            if email.get('id') == email_id:
                return {
                    'success': True,
                    'email_id': email_id,
                    'status': 'sent',
                    'location': 'sent',
                    'sent_at': email.get('sent_at'),
                    'mailgun_id': email.get('mailgun_id'),
                    'opened': email.get('opened', False),
                    'clicked': email.get('clicked', False)
                }
    
    # Check failed emails
    failed_file = DATADEPOT_DIR / 'queue' / 'failed_emails.json'
    if failed_file.exists():
        with open(failed_file, 'r') as f:
            failed = json.load(f)
        for email in failed:
            if email.get('id') == email_id:
                return {
                    'success': True,
                    'email_id': email_id,
                    'status': 'failed',
                    'location': 'failed',
                    'failed_at': email.get('failed_at'),
                    'error': email.get('error', 'Unknown error')
                }
    
    return JSONResponse(status_code=404, content={'error': 'Email not found', 'email_id': email_id})

@app.get("/api/emails/recent")
async def get_recent_emails(limit: int = Query(20, ge=1, le=100)):
    """Get recent email activity for dashboard"""
    activities = []
    
    # Get sent emails
    sent_file = DATADEPOT_DIR / 'queue' / 'sent_emails.json'
    if sent_file.exists():
        with open(sent_file, 'r') as f:
            sent = json.load(f)
        for email in sent[-limit:]:
            activities.append({
                'type': 'email_sent',
                'id': email.get('id'),
                'description': f"Email sent to {email.get('to_email', 'unknown')}",
                'details': {
                    'to_name': email.get('to_name', ''),
                    'to_email': email.get('to_email', ''),
                    'company_name': email.get('company_name', ''),
                    'subject': email.get('subject', ''),
                    'template': email.get('template', 'unknown'),
                    'campaign_id': email.get('campaign_id', '')
                },
                'timestamp': email.get('sent_at', ''),
                'status': 'sent'
            })
    
    # Get failed emails
    failed_file = DATADEPOT_DIR / 'queue' / 'failed_emails.json'
    if failed_file.exists():
        with open(failed_file, 'r') as f:
            failed = json.load(f)
        for email in failed[-limit:]:
            activities.append({
                'type': 'email_failed',
                'id': email.get('id'),
                'description': f"Email failed to {email.get('to_email', 'unknown')}",
                'details': {
                    'to_name': email.get('to_name', ''),
                    'to_email': email.get('to_email', ''),
                    'company_name': email.get('company_name', ''),
                    'subject': email.get('subject', ''),
                    'template': email.get('template', 'unknown'),
                    'error': email.get('error', 'Unknown error')
                },
                'timestamp': email.get('failed_at', ''),
                'status': 'failed'
            })
    
    # Get cancelled emails from queue history
    cancelled_file = DATADEPOT_DIR / 'queue' / 'cancelled_emails.json'
    if cancelled_file.exists():
        with open(cancelled_file, 'r') as f:
            cancelled = json.load(f)
        for email in cancelled[-limit:]:
            activities.append({
                'type': 'email_cancelled',
                'id': email.get('id'),
                'description': f"Email cancelled for {email.get('to_email', 'unknown')}",
                'details': {
                    'to_name': email.get('to_name', ''),
                    'to_email': email.get('to_email', ''),
                    'company_name': email.get('company_name', ''),
                    'subject': email.get('subject', ''),
                    'template': email.get('template', 'unknown')
                },
                'timestamp': email.get('cancelled_at', ''),
                'status': 'cancelled'
            })
    
    # Sort by timestamp descending
    activities.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    
    return {
        'activities': activities[:limit],
        'total': len(activities),
        'summary': {
            'sent_today': len([a for a in activities if a['type'] == 'email_sent' and a.get('timestamp', '').startswith(datetime.now().strftime('%Y-%m-%d'))]),
            'failed_today': len([a for a in activities if a['type'] == 'email_failed' and a.get('timestamp', '').startswith(datetime.now().strftime('%Y-%m-%d'))]),
            'cancelled_today': len([a for a in activities if a['type'] == 'email_cancelled' and a.get('timestamp', '').startswith(datetime.now().strftime('%Y-%m-%d'))])
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8082, log_level="info")
