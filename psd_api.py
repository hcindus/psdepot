#!/usr/bin/env python3
"""
DepotChaos API - Performance Supply Depot Dashboard Integration
Provides REST API endpoints for the PSD Dashboard
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import json
from pathlib import Path
from datetime import datetime, timedelta
import uvicorn

app = FastAPI(title="DepotChaos API", version="1.0.0")

# CORS for dashboard access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = Path('/root/.openclaw/workspace/data/depot_chaos/unified.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def fix_customer_row(row):
    """Map old schema (name) to new schema (business_name)"""
    if row is None:
        return None
    d = dict(row)
    # Map 'name' to 'business_name' for compatibility
    if 'name' in d and 'business_name' not in d:
        d['business_name'] = d.pop('name')
    return d

@app.get("/")
def root():
    return {"service": "DepotChaos API", "status": "running", "version": "1.0.0"}

@app.get("/api/dashboard/overview")
def dashboard_overview():
    """Get dashboard overview statistics"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Total customers
    cursor.execute("SELECT COUNT(*) as total FROM psd_customers")
    total_customers = cursor.fetchone()['total']
    
    # Active customers
    cursor.execute("SELECT COUNT(*) as active FROM psd_customers WHERE status = 'active'")
    active_customers = cursor.fetchone()['active']
    
    # Total revenue from sales table (use 2025 if available, fallback to 2022)
    cursor.execute("SELECT COALESCE(SUM(amount), 0) as total FROM psd_customer_sales WHERE year = 2025")
    total_revenue = cursor.fetchone()['total']
    if total_revenue == 0:
        cursor.execute("SELECT COALESCE(SUM(amount), 0) as total FROM psd_customer_sales WHERE year = 2022")
        total_revenue = cursor.fetchone()['total']
    
    # Average monthly revenue
    cursor.execute("SELECT AVG(amount) as avg FROM psd_customer_sales")
    avg_monthly = cursor.fetchone()['avg'] or 0
    
    # Contacts due (predicted within next 30 days)
    thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
    cursor.execute("""
        SELECT COUNT(*) as due FROM psd_customers 
        WHERE last_contact IS NULL OR last_contact < ?
    """, (thirty_days_ago,))
    contacts_due = cursor.fetchone()['due']
    
    # Customers by category
    cursor.execute("""
        SELECT category, COUNT(*) as count FROM psd_customers 
        GROUP BY category
    """)
    by_category = {row['category']: row['count'] for row in cursor.fetchall()}
    
    # Customers by tier (NEW)
    cursor.execute("""
        SELECT COALESCE(tier, 'stone') as tier_name, COUNT(*) as count 
        FROM psd_customers 
        GROUP BY COALESCE(tier, 'stone')
    """)
    by_tier_raw = {row['tier_name']: row['count'] for row in cursor.fetchall()}
    
    # Map tier IDs to display names for frontend compatibility
    tier_name_map = {
        'diamond': 'Top 165',
        'platinum': 'Top 165',
        'gold': 'Spot On Target',
        'silver': 'Prime',
        'bronze': 'PPCL',
        'stone': 'Stone'
    }
    by_tier = {}
    for tier_id, count in by_tier_raw.items():
        display_name = tier_name_map.get(tier_id, tier_id)
        by_tier[display_name] = by_tier.get(display_name, 0) + count
    
    conn.close()
    
    return {
        "total_customers": total_customers,
        "active_customers": active_customers,
        "total_revenue_2022": round(total_revenue, 2),
        "total_revenue_2025": round(total_revenue, 2),
        "avg_monthly_revenue": round(avg_monthly, 2),
        "contacts_due": contacts_due,
        "by_category": by_category,
        "by_tier": by_tier,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/dashboard/monthly-revenue")
def monthly_revenue(year: int = 2022):
    """Get monthly revenue breakdown"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT month, SUM(amount) as revenue
        FROM psd_customer_sales
        WHERE year = ?
        GROUP BY month
        ORDER BY CASE month
            WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
            WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
            WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
            WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
        END
    """, (year,))
    
    months_order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    data = {row['month']: row['revenue'] for row in cursor.fetchall()}
    
    result = [
        {"month": m, "revenue": round(data.get(m, 0), 2)}
        for m in months_order
    ]
    
    conn.close()
    return {"year": year, "data": result}

@app.get("/api/dashboard/revenue-by-category")
def revenue_by_category(year: int = 2022):
    """Get revenue breakdown by category"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT c.category, SUM(s.amount) as revenue
        FROM psd_customers c
        JOIN psd_customer_sales s ON c.id = s.customer_id
        WHERE s.year = ?
        GROUP BY c.category
    """, (year,))
    
    result = [
        {"category": row['category'], "revenue": round(row['revenue'], 2)}
        for row in cursor.fetchall()
    ]
    
    conn.close()
    return {"year": year, "data": result}

@app.get("/api/customers")
def list_customers(
    skip: int = 0,
    limit: int = 100,
    category: str = Query(None, description="Filter by category"),
    search: str = Query(None, description="Search business name")
):
    """List customers with pagination and filtering"""
    conn = get_db()
    cursor = conn.cursor()
    
    query = "SELECT * FROM psd_customers WHERE 1=1"
    params = []
    
    if category:
        query += " AND category = ?"
        params.append(category)
    
    if search:
        query += " AND name LIKE ?"
        params.append(f"%{search}%")
    
    query += " ORDER BY name LIMIT ? OFFSET ?"
    params.extend([limit, skip])
    
    cursor.execute(query, params)
    customers = [fix_customer_row(row) for row in cursor.fetchall()]
    
    # Get total count
    count_query = "SELECT COUNT(*) as total FROM psd_customers WHERE 1=1"
    count_params = []
    if category:
        count_query += " AND category = ?"
        count_params.append(category)
    if search:
        count_query += " AND name LIKE ?"
        count_params.append(f"%{search}%")
    
    cursor.execute(count_query, count_params)
    total = cursor.fetchone()['total']
    
    conn.close()
    
    return {
        "customers": customers,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@app.get("/api/customers/{customer_id}")
def get_customer(customer_id: int):
    """Get single customer details with sales history"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM psd_customers WHERE id = ?", (customer_id,))
    customer = cursor.fetchone()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    customer = fix_customer_row(customer)
    
    cursor.execute("""
        SELECT year, month, amount FROM psd_customer_sales
        WHERE customer_id = ? ORDER BY year DESC, month
    """, (customer_id,))
    sales = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        "customer": dict(customer),
        "sales_history": sales
    }

@app.get("/api/predicted-contacts")
def predicted_contacts(days: int = 30):
    """Get list of customers predicted to need contact"""
    conn = get_db()
    cursor = conn.cursor()
    
    cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
    
    cursor.execute("""
        SELECT 
            id,
            name as business_name,
            city,
            last_contact,
            system_type,
            category,
            CASE 
                WHEN last_contact IS NULL THEN 'high'
                WHEN last_contact < ? THEN 'medium'
                ELSE 'low'
            END as priority
        FROM psd_customers
        WHERE (last_contact IS NULL OR last_contact < ?)
        AND status = 'active'
        ORDER BY 
            CASE 
                WHEN last_contact IS NULL THEN 1
                ELSE 2
            END,
            last_contact ASC
        LIMIT 100
    """, (cutoff_date, cutoff_date))
    
    contacts = [fix_customer_row(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        "contacts": contacts,
        "count": len(contacts),
        "period_days": days
    }

@app.get("/api/dashboard/system-distribution")
def system_distribution():
    """Get customer distribution by POS system type"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT system_type, COUNT(*) as count 
        FROM psd_customers 
        WHERE system_type IS NOT NULL AND system_type != ''
        GROUP BY system_type 
        ORDER BY count DESC
    """)
    
    result = [
        {"system": row['system_type'], "count": row['count']}
        for row in cursor.fetchall()
    ]
    
    conn.close()
    return {"data": result}

@app.get("/api/dashboard/city-distribution")
def city_distribution(limit: int = 20):
    """Get customer distribution by city"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT city, COUNT(*) as count 
        FROM psd_customers 
        WHERE city IS NOT NULL AND city != ''
        GROUP BY city 
        ORDER BY count DESC
        LIMIT ?
    """, (limit,))
    
    result = [
        {"city": row['city'], "count": row['count']}
        for row in cursor.fetchall()
    ]
    
    conn.close()
    return {"data": result}

@app.get("/api/dashboard/trends")
def trends(year: int = Query(None)):
    """Get category trends over years"""
    conn = get_db()
    cursor = conn.cursor()
    
    if year:
        cursor.execute("""
            SELECT c.category, SUM(s.amount) as revenue, COUNT(*) as customers
            FROM psd_customers c
            JOIN psd_customer_sales s ON c.id = s.customer_id
            WHERE s.year = ?
            GROUP BY c.category
        """, (year,))
        
        result = {
            row['category']: {
                'revenue': round(row['revenue'], 2),
                'customers': row['customers']
            }
            for row in cursor.fetchall()
        }
    else:
        cursor.execute("""
            SELECT s.year, c.category, SUM(s.amount) as revenue
            FROM psd_customers c
            JOIN psd_customer_sales s ON c.id = s.customer_id
            GROUP BY s.year, c.category
            ORDER BY s.year DESC
        """)
        
        result = {}
        for row in cursor.fetchall():
            year = str(row['year'])
            if year not in result:
                result[year] = {}
            result[year][row['category']] = round(row['revenue'], 2)
    
    conn.close()
    return {"data": result}

@app.get("/api/forecast/2026")
def forecast_2026():
    """Generate 2026 revenue forecast based on 2022 data"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Get 2022 monthly data for projection
    cursor.execute("""
        SELECT month, SUM(amount) as revenue
        FROM psd_customer_sales
        WHERE year = 2022
        GROUP BY month
    """)
    
    monthly_2022 = {row['month']: row['revenue'] for row in cursor.fetchall()}
    
    # Simple projection: 15% growth over 2022
    growth_factor = 1.15
    
    months_order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    projection = []
    for month in months_order:
        base = monthly_2022.get(month, 0)
        projected = base * growth_factor
        projection.append({
            "month": month,
            "2022_actual": round(base, 2),
            "2026_projected": round(projected, 2),
            "growth": round(projected - base, 2)
        })
    
    total_2022 = sum(monthly_2022.values())
    total_2026 = total_2022 * growth_factor
    
    conn.close()
    
    return {
        "projection": projection,
        "total_2022": round(total_2022, 2),
        "total_2026_projected": round(total_2026, 2),
        "assumed_growth_rate": "15%"
    }

@app.post("/api/customers/{customer_id}/contact")
def record_contact(customer_id: int):
    """Record that a customer was contacted"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE psd_customers 
        SET last_contact = ?, next_predicted_contact = ?
        WHERE id = ?
    """, (
        datetime.now().isoformat(),
        (datetime.now() + timedelta(days=90)).isoformat(),  # Next contact in 90 days
        customer_id
    ))
    
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Contact recorded"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8081)
