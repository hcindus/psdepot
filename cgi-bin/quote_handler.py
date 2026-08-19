#!/usr/bin/env python3
"""
PSDepot Contact Form Handler - Sends quote requests to Telegram
"""

import cgi
import cgitb
import json
import urllib.request
import urllib.parse
import sys
import os

# Telegram config (from telegram_webhook_receiver.py)
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
        print(f"Telegram error: {e}", file=sys.stderr)
        return {"ok": False, "error": str(e)}

def main():
    print("Content-Type: application/json\n")
    
    # Get form data
    form = cgi.FieldStorage()
    
    name = form.getvalue('name', 'Not provided')
    business = form.getvalue('business', 'Not provided')
    phone = form.getvalue('phone', 'Not provided')
    email = form.getvalue('email', 'Not provided')
    interest = form.getvalue('interest', 'Not specified')
    message = form.getvalue('message', 'No message')
    
    # Format interest nicely
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
    
    # Build Telegram message
    telegram_msg = f"""🆕 <b>NEW QUOTE REQUEST</b>

👤 <b>Name:</b> {name}
🏢 <b>Business:</b> {business}
📞 <b>Phone:</b> {phone}
📧 <b>Email:</b> {email}
📦 <b>Interest:</b> {interest_display}

💬 <b>Message:</b>
{message}

—
<i>psdepot.com contact form</i>"""
    
    # Send to Telegram
    result = send_telegram_message(telegram_msg)
    
    if result.get('ok'):
        print(json.dumps({"success": True, "message": "Quote request sent!"}))
    else:
        print(json.dumps({"success": False, "error": "Failed to send. Please try again or call directly."}))

if __name__ == '__main__':
    cgitb.enable()
    main()
