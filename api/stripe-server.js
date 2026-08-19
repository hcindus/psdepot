// Stripe Payment API Proxy for psdepot.com
// This script handles the payment intent creation
// Since the API runs on a different port, we use a serverless approach

const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'usd', items = [] } = req.body;
        
        const intent = await stripe.paymentIntents.create({
            amount,
            currency,
            automatic_payment_methods: { enabled: true },
            metadata: { items: JSON.stringify(items) }
        });
        
        res.json({
            clientSecret: intent.client_secret,
            paymentIntentId: intent.id
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.listen(8084, () => console.log('Stripe API running on port 8084'));
