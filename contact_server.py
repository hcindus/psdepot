#!/usr/bin/env python3
"""
PSDepot Contact Form Server - Sends quote requests to Telegram
Runs on port 5000, receives form submissions
"""

from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import urllib.request
import cgi
import io

# Telegram config
TELEGRAM_TOKEN = "8494851411:AAHgUJpjd5X6roCQwMfHsRB2ZCy8gl3YgbM"
CHAT_ID = "1611228942"

def send_telegram_message(text):
    """Send message to Telegram"""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        data = json.dumps({
            "chat_id": CHAT_ID,
            "text": text,
            "parse_mode": "HTML"
        }).encode()
        req = urllib.request.Request(
            url, data=data,
            headers={'Content-Type': 'application/json'}
        )
        response = urllib.request.urlopen(req, timeout=10)
        return json.loads(response.read().decode())
    except Exception as e:
        print(f"Telegram error: {e}")
        return {"ok": False, "error": str(e)}

class ContactHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        if self.path != '/quote':
            self.send_error(404)
            return
        
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        # Parse form data
        params = urllib.parse.parse_qs(post_data)
        
        name = params.get('name', ['Not provided'])[0]
        business = params.get('business', ['Not provided'])[0]
        phone = params.get('phone', ['Not provided'])[0]
        email = params.get('email', ['Not provided'])[0]
        interest = params.get('interest', ['Not specified'])[0]
        message = params.get('message', ['No message'])[0]
        
        # Format interest
        interest_map = {
            'thermal-paper': 'Thermal Paper',
            'ribbons': 'Printer Ribbons',
            'hardware': 'POS Hardware',
            'repair': 'Repair Services',
            'cabling': 'Custom Cabling',
            'installation': 'POS Installation',
            'other': 'Other'
        }
        interest_display = interest_map.get(interest, interest)
        
        # Build message
        telegram_msg = f"""🆕 <b>NEW QUOTE REQUEST</b>

👤 <b>Name:</b> {name}
🏢 <b>Business:</b> {business}
📞 <b>Phone:</b> {phone}
📧 <b>Email:</b> {email}
📦 <b>Interest:</b> {interest_display}

💬 <b>Message:</b>
{message}

—
<i>psdepot.com</i>"""
        
        result = send_telegram_message(telegram_msg)
        
        self.send_response(200 if result.get('ok') else 500)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({
            "success": result.get('ok', False),
            "message": "Sent to Telegram" if result.get('ok') else result.get('error', 'Failed')
        }).encode())
    
    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {format % args}")

def run_server(port=5000):
    server = HTTPServer(('127.0.0.1', port), ContactHandler)
    print(f"PSDepot Contact Server running on port {port}")
    server.serve_forever()

if __name__ == '__main__':
    run_server()
