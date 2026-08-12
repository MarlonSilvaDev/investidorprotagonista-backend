"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const supabase_1 = require("../../config/supabase");
const checkLicensing_1 = require("../../shared/middlewares/checkLicensing");
const stripe_1 = __importDefault(require("stripe"));
function getStripe() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
        throw new Error('STRIPE_SECRET_KEY não configurada no .env');
    }
    return new stripe_1.default(apiKey, {
        apiVersion: '2024-04-10',
    });
}
class PaymentController {
    // ─── STRIPE (Web, Windows, Mac) ───
    async createCheckoutSession(request, response) {
        const stripe = getStripe();
        const { id: userId, userType } = request.user;
        const { priceId, plan } = request.body;
        const targetPlan = (0, checkLicensing_1.normalizePlan)(plan, userType);
        const { data: profile } = await supabase_1.supabase
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
            await supabase_1.supabase
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
            metadata: { userId, plan: targetPlan },
        });
        return response.json({ url: session.url });
    }
    // ─── IN-APP PURCHASE (iOS/Android) ───
    async verifyPurchase(request, response) {
        const { id: userId, userType } = request.user;
        const { plan, platform } = request.body;
        const targetPlan = (0, checkLicensing_1.normalizePlan)(plan, userType);
        const origin = platform === 'ios' ? 'app_store' : 'google_play';
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        const { data: profile, error } = await supabase_1.supabase
            .from('profiles')
            .update({
            plan: targetPlan,
            subscription_origin: origin,
            subscription_status: 'active',
            subscription_expires_at: oneYearFromNow.toISOString(),
            updated_at: new Date().toISOString(),
        })
            .eq('id', userId)
            .select()
            .single();
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        return response.json({
            message: 'Compra verificada e plano atualizado no banco de dados com sucesso',
            profile,
        });
    }
    // ─── UPGRADE DE PLANO DIRETO / API ───
    async updatePlan(request, response) {
        const { id: userId, userType } = request.user;
        const { plan, origin } = request.body;
        const targetPlan = (0, checkLicensing_1.normalizePlan)(plan, userType);
        const targetOrigin = origin || (targetPlan === 'free' ? 'free' : 'stripe');
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        const { data: profile, error } = await supabase_1.supabase
            .from('profiles')
            .update({
            plan: targetPlan,
            subscription_origin: targetOrigin,
            subscription_status: targetPlan === 'free' ? 'trial' : 'active',
            subscription_expires_at: targetPlan === 'free' ? null : oneYearFromNow.toISOString(),
            updated_at: new Date().toISOString(),
        })
            .eq('id', userId)
            .select()
            .single();
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        return response.json({
            message: 'Plano atualizado com sucesso no Supabase',
            profile,
        });
    }
    // ─── WEBHOOK STRIPE ───
    async stripeWebhook(request, response) {
        const stripe = getStripe();
        const sig = request.headers['stripe-signature'];
        let event;
        try {
            event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        }
        catch (err) {
            return response.status(400).send(`Webhook Error: ${err.message}`);
        }
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = session.metadata?.userId;
            const targetPlan = session.metadata?.plan || 'pro_usuario';
            const subscriptionId = session.subscription;
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const expiresAt = new Date(subscription.current_period_end * 1000);
            if (userId) {
                await supabase_1.supabase
                    .from('profiles')
                    .update({
                    plan: targetPlan,
                    subscription_origin: 'stripe',
                    subscription_status: 'active',
                    subscription_expires_at: expiresAt.toISOString(),
                    stripe_subscription_id: subscriptionId,
                    updated_at: new Date().toISOString(),
                })
                    .eq('id', userId);
            }
        }
        return response.json({ received: true });
    }
}
exports.PaymentController = PaymentController;
//# sourceMappingURL=PaymentController.js.map