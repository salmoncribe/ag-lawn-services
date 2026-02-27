from __future__ import annotations

from dataclasses import dataclass

import stripe

from app.config import Settings


@dataclass(frozen=True)
class PackageConfig:
    package_id: str
    price_id: str
    credits: int

class StripeService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        stripe.api_key = settings.stripe_secret_key
        # We repurpose the existing price environment variables as one-time package prices
        self.packages: dict[str, PackageConfig] = {
            "starter": PackageConfig(
                package_id="starter",
                price_id=settings.stripe_price_basic,
                credits=10,
            ),
            "creator": PackageConfig(
                package_id="creator",
                price_id=settings.stripe_price_pro,
                credits=50,
            ),
            "pro": PackageConfig(
                package_id="pro",
                price_id=settings.stripe_price_agency,
                credits=100,
            ),
        }
        self.price_to_package = {
            config.price_id: config.package_id for config in self.packages.values() if config.price_id
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
        package_id: str,
        customer_id: str | None = None,
    ) -> stripe.checkout.Session:
        package = self.packages.get(package_id)
        if not package or not package.price_id:
            raise ValueError(f"Unsupported package ID: {package_id}")

        customer = self.create_or_get_customer(email, customer_id)
        return stripe.checkout.Session.create(
            customer=customer.id,
            mode="payment", # One-time payment instead of subscription
            line_items=[{"price": package.price_id, "quantity": 1}],
            success_url=self.settings.stripe_success_url,
            cancel_url=self.settings.stripe_cancel_url,
            metadata={
                "user_id": user_id, 
                "package_id": package.package_id,
                "credits": package.credits
            },
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
