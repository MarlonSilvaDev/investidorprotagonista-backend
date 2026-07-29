import { Request, Response } from 'express';
import { supabase } from '../../database/supabase';
import Stripe from 'stripe';

function getStripe() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error('STRIPE_SECRET_KEY não configurada no .env');
  }
  return new Stripe(apiKey, {
    apiVersion: '2024-04-10' as any,
  });
}

export class PaymentController {
  // ─── STRIPE (Web, Windows, Mac) ───
  async createCheckoutSession(request: Request, response: Response) {
    const stripe = getStripe();
    const { id: userId } = request.user;
    const { priceId } = request.body;

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email,
        metadata: { userId },
      });
      customerId = customer.id;
      
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.APP_URL}/payment/success`,
      cancel_url: `${process.env.APP_URL}/payment/cancel`,
      metadata: { userId },
    });

    return response.json({ url: session.url });
  }

  // ─── IN-APP PURCHASE (iOS/Android) ───
  async verifyPurchase(request: Request, response: Response) {
    const { id: userId } = request.user;
    const { productId, purchaseToken, platform } = request.body;

    // Aqui deve entrar a lógica de verificação com Google Play Billing / App Store Connect
    // O backend valida o token recebido do Flutter antes de liberar a licença
    
    // Mock de sucesso para demonstração
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_expires_at: oneYearFromNow.toISOString(),
      })
      .eq('id', userId);

    return response.json({ message: 'Purchase verified and license updated' });
  }

  // ─── WEBHOOK STRIPE ───
  async stripeWebhook(request: Request, response: Response) {
    const stripe = getStripe();
    const sig = request.headers['stripe-signature'] as string;
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err: any) {
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const subscriptionId = session.subscription as string;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const expiresAt = new Date(subscription.current_period_end * 1000);

      await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_expires_at: expiresAt.toISOString(),
          stripe_subscription_id: subscriptionId,
        })
        .eq('id', userId);
    }

    return response.json({ received: true });
  }
}
