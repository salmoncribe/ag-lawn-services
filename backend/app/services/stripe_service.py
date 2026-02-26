from __future__ import annotations

from dataclasses import dataclass

import stripe

from app.config import Settings


@dataclass(frozen=True)
class PlanConfig:
    tier: str
    price_id: str
    clip_limit: int | None
    connected_platforms: int


class StripeService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        stripe.api_key = settings.stripe_secret_key
        self.plans: dict[str, PlanConfig] = {
            "basic": PlanConfig(
                tier="basic",
                price_id=settings.stripe_price_basic,
                clip_limit=5,
                connected_platforms=1,
            ),
            "pro": PlanConfig(
                tier="pro",
                price_id=settings.stripe_price_pro,
                clip_limit=None,
                connected_platforms=3,
            ),
            "agency": PlanConfig(
                tier="agency",
                price_id=settings.stripe_price_agency,
                clip_limit=None,
                connected_platforms=10,
            ),
        }
        self.price_to_tier = {
            config.price_id: tier for tier, config in self.plans.items() if config.price_id
        }

    def create_or_get_customer(self, email: str, customer_id: str | None = None) -> stripe.Customer:
        if customer_id:
            return stripe.Customer.retrieve(customer_id)
        customers = stripe.Customer.list(email=email, limit=1)
        if customers.data:
            return customers.data[0]
        return stripe.Customer.create(email=email)

    def create_checkout_session(
        self,
        user_id: str,
        email: str,
        plan_tier: str,
        customer_id: str | None = None,
    ) -> stripe.checkout.Session:
        plan = self.plans.get(plan_tier)
        if not plan or not plan.price_id:
            raise ValueError("Unsupported subscription tier")

        customer = self.create_or_get_customer(email, customer_id)
        return stripe.checkout.Session.create(
            customer=customer.id,
            mode="subscription",
            line_items=[{"price": plan.price_id, "quantity": 1}],
            success_url=self.settings.stripe_success_url,
            cancel_url=self.settings.stripe_cancel_url,
            metadata={"user_id": user_id, "plan_tier": plan.tier},
            allow_promotion_codes=True,
        )

    def create_billing_portal(self, customer_id: str) -> stripe.billing_portal.Session:
        return stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{self.settings.base_url}/dashboard.html",
        )

    def construct_event(self, payload: bytes, signature: str):
        return stripe.Webhook.construct_event(
            payload=payload,
            sig_header=signature,
            secret=self.settings.stripe_webhook_secret,
        )

    def tier_from_subscription(self, subscription: dict) -> str:
        items = subscription.get("items", {}).get("data", [])
        if not items:
            return "basic"
        price_id = items[0].get("price", {}).get("id")
        return self.price_to_tier.get(price_id, "basic")
