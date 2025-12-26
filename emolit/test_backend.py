import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_register():
    print("Testing Registration...")
    url = f"{BASE_URL}/api/auth/register"
    payload = {
        "email": "testuser@example.com",
        "password": "password123",
        "full_name": "Test User"
    }
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_register()
