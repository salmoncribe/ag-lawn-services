from fastapi.testclient import TestClient
from app.main import app
from app.services.local_db_service import LocalDBService
from app.config import get_settings

client = TestClient(app)

def test_process_clip():
    settings = get_settings()
    db = LocalDBService(settings)
    
    # 1. Login to get token
    email = "test_payclip@example.com"
    password = "password123"
    
    try:
        db.sign_up(email, password)
    except Exception:
        pass
        
    auth_res = client.post("/auth/login", json={"email": email, "password": password})
    assert auth_res.status_code == 200
    token = auth_res.json()["session"]["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Add some credits directly to the DB so the user has enough
    user_payload = db.sign_in(email, password)
    user_id = user_payload["user"]["id"]
    db.add_credits(user_id, 2)
    
    profile_before = db.get_profile(user_id)
    credits_before = profile_before.get("credit_balance", 0)
    print(f"Credits before processing: {credits_before}")
    
    # 3. Call /clips/process endpoint
    payload = {
        "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
    
    res = client.post("/clips/process", json=payload, headers=headers)
    print("Response syntax:", res.json())
    assert res.status_code == 200
    assert res.json()["ok"] is True
    
    # 4. Check that credits were deducted
    profile_after = db.get_profile(user_id)
    credits_after = profile_after.get("credit_balance", 0)
    print(f"Credits after processing: {credits_after}")
    
    assert credits_after == credits_before - 1
    print("API Integration test passed!")
    
if __name__ == "__main__":
    test_process_clip()
