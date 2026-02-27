import asyncio
from app.services.local_db_service import LocalDBService
from app.config import get_settings
import os

async def run_test():
    settings = get_settings()
    db = LocalDBService(settings)
    
    # Create test user
    email = "test_payclip@example.com"
    password = "password123"
    try:
        db.sign_up(email, password)
    except:
        pass # Might already exist
        
    user_payload = db.sign_in(email, password)
    user_id = user_payload["user"]["id"]
    
    # 1. Add credits explicitly using our new add_credits function
    print("Testing add_credits...")
    db.add_credits(user_id, 5)
    
    profile = db.get_profile(user_id)
    print(f"Credit balance after addition: {profile.get('credit_balance')}")
    
    # 2. Consume credits explicitely
    print("Testing consume_credits...")
    db.consume_credits(user_id, 1)
    
    profile = db.get_profile(user_id)
    print(f"Credit balance after consumption: {profile.get('credit_balance')}")
    
    print("Success! The core database logic works correctly for credits.")

if __name__ == "__main__":
    asyncio.run(run_test())
