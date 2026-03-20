import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripeServer() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      appInfo: {
        name: "Lubbock Lawn Pros"
      }
    });
  }

  return stripeInstance;
}

export async function getReceiptUrl(sessionId: string) {
  try {
    const stripe = getStripeServer();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent.latest_charge"]
    });

    if (
      session.payment_intent &&
      typeof session.payment_intent !== "string" &&
      session.payment_intent.latest_charge &&
      typeof session.payment_intent.latest_charge !== "string"
    ) {
      return session.payment_intent.latest_charge.receipt_url ?? null;
    }

    return null;
  } catch {
    return null;
  }
}
