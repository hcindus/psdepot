#!/usr/bin/env python3
"""
Stripe Payment Server for Performance Supply Depot
Handles PaymentIntent creation and webhook verification
"""

import os
import json
import stripe
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["https://psdepot.com", "http://localhost"])

# Stripe Configuration
# Use environment variable or test key
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', 'YOUR_STRIPE_TEST_KEY')
stripe.api_key = STRIPE_SECRET_KEY

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "payment-server"})

@app.route('/create-payment-intent', methods=['POST'])
def create_payment_intent():
    try:
        data = request.get_json()
        amount_cents = data.get('amount')  # Amount in cents
        currency = data.get('currency', 'usd')
        items = data.get('items', [])
        
        if not amount_cents:
            return jsonify({"error": "Amount required"}), 400
        
        # Create line items for Stripe
        line_items = []
        for item in items:
            line_items.append({
                "name": item.get('name', 'POS Supply Item'),
                "sku": item.get('sku', ''),
                "quantity": item.get('quantity', 1),
                "amount": item.get('price', 0)
            })
        
        # Create PaymentIntent
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency=currency,
            automatic_payment_methods={"enabled": True},
            metadata={
                "items": json.dumps(line_items),
                "source": "psdepot-web"
            }
        )
        
        return jsonify({
            "clientSecret": intent.client_secret,
            "paymentIntentId": intent.id
        })
        
    except stripe.error.StripeError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/webhook', methods=['POST'])
def webhook():
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    endpoint_secret = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
    
    try:
        if endpoint_secret:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        else:
            event = json.loads(payload)
    except ValueError:
        return jsonify({"error": "Invalid payload"}), 400
    except stripe.error.SignatureVerificationError:
        return jsonify({"error": "Invalid signature"}), 400
    
    # Handle events
    event_type = event.get('type')
    
    if event_type == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        print(f"✅ Payment succeeded: {payment_intent['id']}")
        # TODO: Send email notification, update inventory, etc.
        
    elif event_type == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        print(f"❌ Payment failed: {payment_intent['id']}")
        
    return jsonify({"status": "success"})

@app.route('/lookup-business', methods=['POST'])
def lookup_business():
    """Lookup business by phone number"""
    data = request.get_json()
    phone = data.get('phone', '').strip()
    
    if not phone:
        return jsonify({"found": False, "error": "Phone number required"})
    
    # Remove formatting
    clean_phone = re.sub(r'\D', '', phone)
    
    # In production, integrate with:
    # - Twilio Lookup API
    # - Whitepages Pro
    # - Neustar
    # - Internal customer database
    
    # For demo: simulate lookup
    demo_db = {
        "4155551234": {
            "name": "Acme Restaurant",
            "address": {
                "street": "123 Market St",
                "city": "San Francisco",
                "state": "CA",
                "zip": "94102"
            }
        },
        "8888816834": {
            "name": "Performance Supply Depot",
            "address": {
                "street": "123 Business Ave",
                "city": "San Francisco",
                "state": "CA",
                "zip": "94102"
            }
        }
    }
    
    if clean_phone in demo_db:
        return jsonify({
            "found": True,
            "business": demo_db[clean_phone],
            "source": "demo"
        })
    
    return jsonify({"found": False})

if __name__ == '__main__':
    port = int(os.environ.get('PAYMENT_PORT', 8081))
    app.run(host='127.0.0.1', port=port, debug=False)
