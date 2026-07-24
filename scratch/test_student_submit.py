import requests

url = "http://localhost:8000/api/v1/attendance/public/submit"

# First get active session and current token
sess_info = requests.get("http://localhost:8000/api/v1/sessions/active-by-event/1").json()
session_uuid = sess_info["session"]["session_uuid"]
token = sess_info["session"]["current_token"]

payload = {
    "session_uuid": session_uuid,
    "student_name": "Test Student Verification",
    "gr_number": "TEST2026GR099",
    "roll_number": "99",
    "department": "Computer Engineering",
    "year": "SE",
    "semester": 4,
    "class_name": "SE-Comp",
    "division": "A",
    "presence_token": token,
    "device_fingerprint": "fp_test_device_123"
}

response = requests.post(url, json=payload)
print("Status Code:", response.status_code)
print("Response JSON:", response.json())
