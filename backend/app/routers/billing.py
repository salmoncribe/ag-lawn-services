from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, Request

from app.deps import (
    get_current_profile,
    get_current_user,
    get_stripe_service,
    get_supabase_service,
)
from app.schemas import CheckoutPayload
from app.services.stripe_service import StripeService
from app.services.supabase_service import SupabaseService

router = APIRouter(prefix="/billing", tags=["billing"])


@router.post("/checkout")
async def create_checkout(
    payload: CheckoutPayload,
    user: dict = Depends(get_current_user),
    profile: dict = Depends(get_current_profile),
    stripe_service: StripeService = Depends(get_stripe_service),
    supabase: SupabaseService = Depends(get_supabase_service),
):
    session = stripe_service.create_checkout_session(
        user_id=user["id"],
        email=user.get("email", ""),
        plan_tier=payload.plan_tier,
        customer_id=profile.get("stripe_customer_id"),
    )

    if not profile.get("stripe_customer_id") and session.customer:
        supabase.set_customer_id(user["id"], session.customer)

    return {"checkout_url": session.url}


@router.post("/portal")
async def create_billing_portal(
    profile: dict = Depends(get_current_profile),
    stripe_service: StripeService = Depends(get_stripe_service),
):
    customer_id = profile.get("stripe_customer_id")
    if not customer_id:
        raise HTTPException(status_code=400, detail="No Stripe customer found")

    portal = stripe_service.create_billing_portal(customer_id)
    return {"portal_url": portal.url}


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
    stripe_service: StripeService = Depends(get_stripe_service),
    supabase: SupabaseService = Depends(get_supabase_service),
):
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing Stripe signature")

    payload = await request.body()
    event = stripe_service.construct_event(payload, stripe_signature)

    event_type = event["type"]
    obj = event["data"]["object"]

    if event_type == "checkout.session.completed":
        customer_id = obj.get("customer")
        metadata = obj.get("metadata") or {}
        user_id = metadata.get("user_id")
        plan_tier = metadata.get("plan_tier", "basic")

        if user_id and customer_id:
            supabase.set_customer_id(user_id, customer_id)
        if customer_id:
            supabase.update_plan_by_customer(customer_id, plan_tier)

    elif event_type == "customer.subscription.updated":
        customer_id = obj.get("customer")
        status = obj.get("status")
        if customer_id:
            if status in {"active", "trialing"}:
                tier = stripe_service.tier_from_subscription(obj)
            else:
                tier = "basic"
            supabase.update_plan_by_customer(customer_id, tier)

    elif event_type in {"customer.subscription.deleted", "invoice.payment_failed"}:
        customer_id = obj.get("customer")
        if customer_id:
            supabase.update_plan_by_customer(customer_id, "basic")

    return {"received": True}
