from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request

from app.deps import get_current_user, get_stripe_service, get_supabase_service
from app.schemas import CheckoutPayload
from app.services.local_db_service import LocalDBService
from app.services.stripe_service import StripeService

router = APIRouter(prefix="/billing", tags=["billing"])


@router.post("/checkout")
async def create_checkout(
    payload: CheckoutPayload,
    user: dict = Depends(get_current_user),
    stripe_service: StripeService = Depends(get_stripe_service),
    db: LocalDBService = Depends(get_supabase_service),
):
    profile = db.get_profile(user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    customer_id = profile.get("stripe_customer_id")
    try:
        session = stripe_service.create_checkout_session(
            user_id=user["id"],
            email=user["email"],
            package_id=payload.package_id,
            customer_id=customer_id,
        )
        return {"checkout_url": session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/portal")
async def create_billing_portal(
    user: dict = Depends(get_current_user),
    stripe_service: StripeService = Depends(get_stripe_service),
    db: LocalDBService = Depends(get_supabase_service),
):
    profile = db.get_profile(user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    customer_id = profile.get("stripe_customer_id")
    if not customer_id:
        raise HTTPException(status_code=400, detail="No billing history found.")
    
    try:
        session = stripe_service.create_billing_portal(customer_id)
        return {"portal_url": session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_service: StripeService = Depends(get_stripe_service),
    db: LocalDBService = Depends(get_supabase_service),
):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing signature")

    try:
        event = stripe_service.construct_event(payload, sig_header)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        
        user_id = session.get("metadata", {}).get("user_id")
        credits_str = session.get("metadata", {}).get("credits", "0")
        
        try:
            credits = int(credits_str)
        except ValueError:
            credits = 0
            
        customer_id = session.get("customer")
        
        if user_id and credits > 0:
            db.add_credits(user_id, credits)
            
            # Update customer ID if missing
            profile = db.get_profile(user_id)
            if profile and not profile.get("stripe_customer_id") and customer_id:
                try:
                    with db._get_conn() as conn:
                        conn.execute(
                            "UPDATE profiles SET stripe_customer_id = ? WHERE user_id = ?",
                            (customer_id, user_id)
                        )
                except Exception as ex:
                    print(f"Failed to update customer_id for {user_id}: {ex}")

    return {"received": True}
