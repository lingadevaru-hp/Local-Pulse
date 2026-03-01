import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16' as any,
    })
    : null;

export async function POST(req: Request) {
    try {
        const { eventId, eventName, eventDate, eventLocation, price, attendees, email, fullName } = await req.json();

        // If no stripe key, simulate a successful response for demo purposes
        if (!stripe) {
            console.log('Stripe key missing, simulating checkout session...');
            return NextResponse.json({
                sessionId: 'mock_session_id_' + Date.now(),
                url: `/profile?payment=success&eventId=${eventId}&eventName=${encodeURIComponent(eventName)}&eventDate=${encodeURIComponent(eventDate)}&eventLocation=${encodeURIComponent(eventLocation)}&attendees=${attendees}&fullName=${encodeURIComponent(fullName)}`
            });
        }

        // Convert price string (e.g., "₹2000" or "50") to number in cents
        // Remove symbols and handle decimals if any
        const numericPrice = parseFloat(price.replace(/[^\d.]/g, '')) || 0;
        const amount = Math.round(numericPrice * 100);

        if (amount <= 0) {
            return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: email,
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: eventName,
                            metadata: {
                                eventId,
                            },
                        },
                        unit_amount: amount,
                    },
                    quantity: parseInt(attendees),
                },
            ],
            mode: 'payment',
            success_url: `${baseUrl}/profile?payment=success&sessionId={CHECKOUT_SESSION_ID}&eventId=${eventId}&eventName=${encodeURIComponent(eventName)}&eventDate=${encodeURIComponent(eventDate)}&eventLocation=${encodeURIComponent(eventLocation)}&attendees=${attendees}&fullName=${encodeURIComponent(fullName)}`,
            cancel_url: `${baseUrl}/events/${eventId}?payment=cancelled`,
            metadata: {
                eventId,
                eventName,
                attendees,
                fullName,
            },
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
        console.error('Stripe error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
