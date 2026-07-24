import requests

token_res = requests.post("http://localhost:8000/api/v1/auth/login", json={"username": "admin", "password": "admin123"}).json()
headers = {"Authorization": f"Bearer {token_res['access_token']}"}

# Create temporary event to test deletion
create_res = requests.post("http://localhost:8000/api/v1/events", headers=headers, json={
    "name": "Temp Test Event For Deletion",
    "type": "Workshop",
    "organized_by": "CSI-CATT",
    "academic_year": "2025-2026",
    "department": "Computer Engineering",
    "allowed_semesters": "1,2,3,4",
    "venue": "Test Lab",
    "date": "2026-07-24",
    "start_time": "10:00 AM",
    "end_time": "11:00 AM",
    "attendance_duration": 15
}).json()

event_id = create_res["id"]
print("Created temp event ID:", event_id)

# Delete event
del_res = requests.delete(f"http://localhost:8000/api/v1/events/{event_id}", headers=headers)
print("Delete Event Status Code:", del_res.status_code)
