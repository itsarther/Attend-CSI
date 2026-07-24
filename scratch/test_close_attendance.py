import requests

# Test close attendance by event ID
token_res = requests.post("http://localhost:8000/api/v1/auth/login", json={"username": "admin", "password": "admin123"}).json()
headers = {"Authorization": f"Bearer {token_res['access_token']}"}

close_res = requests.post("http://localhost:8000/api/v1/sessions/stop-by-event/1", headers=headers)
print("Close Attendance Status:", close_res.status_code)
print("Close Attendance Response:", close_res.json())
