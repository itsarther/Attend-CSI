import random
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from app.database.session import SessionLocal, engine
from app.database.base import Base
from app.models.user import User
from app.models.event import Event
from app.models.attendance import Attendance
from app.models.audit import AuditLog
from app.core.security import get_password_hash


def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Seed Admin User
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                password_hash=get_password_hash("admin123"),
                full_name="CSI Committee Admin",
                email="admin@csi-catt.org",
                role="ADMIN"
            )
            db.add(admin_user)
            print("[OK] Created default admin user: 'admin' / 'admin123'")

        # 2. Seed Sample Events
        existing_events = db.query(Event).count()
        if existing_events == 0:
            events_data = [
                {
                    "name": "Full-Stack Web Development Workshop with Next.js",
                    "type": "Workshop",
                    "organized_by": "CSI-CATT",
                    "academic_year": "2025-2026",
                    "department": "Computer Engineering",
                    "allowed_semesters": "3,4,5,6",
                    "venue": "Computer Lab 4 (3rd Floor)",
                    "date": date.today(),
                    "start_time": "10:00 AM",
                    "end_time": "01:00 PM",
                    "attendance_duration": 30,
                    "max_capacity": 100,
                    "description": "Hands-on intensive workshop building modern web applications with Next.js 14, Tailwind CSS, and Server Actions.",
                    "status": "LIVE"
                },
                {
                    "name": "AI & Machine Learning Career Seminar",
                    "type": "Seminar",
                    "organized_by": "CSI-CATT",
                    "academic_year": "2025-2026",
                    "department": "Artificial Intelligence & Data Science",
                    "allowed_semesters": "1,2,3,4,5,6,7,8",
                    "venue": "Main Auditorium",
                    "date": date.today() - timedelta(days=2),
                    "start_time": "02:00 PM",
                    "end_time": "04:30 PM",
                    "attendance_duration": 20,
                    "max_capacity": 250,
                    "description": "Industry experts from Google and NVIDIA share insights into machine learning engineering roadmaps and LLM research.",
                    "status": "CLOSED"
                },
                {
                    "name": "CSI CodeBlitz 2026 Hackathon",
                    "type": "Hackathon",
                    "organized_by": "CSI-CATT",
                    "academic_year": "2025-2026",
                    "department": "Computer Engineering",
                    "allowed_semesters": "3,4,5,6,7,8",
                    "venue": "Seminar Hall B",
                    "date": date.today() + timedelta(days=5),
                    "start_time": "09:00 AM",
                    "end_time": "06:00 PM",
                    "attendance_duration": 45,
                    "max_capacity": 150,
                    "description": "24-hour rapid prototyping hackathon solving real-world challenges in smart campus automation and cybersecurity.",
                    "status": "UPCOMING"
                },
                {
                    "name": "Cybersecurity & Ethical Hacking Masterclass",
                    "type": "Technical Event",
                    "organized_by": "CSI-CATT",
                    "academic_year": "2025-2026",
                    "department": "Information Technology",
                    "allowed_semesters": "5,6,7,8",
                    "venue": "IT Lab 2",
                    "date": date.today() - timedelta(days=10),
                    "start_time": "11:00 AM",
                    "end_time": "02:00 PM",
                    "attendance_duration": 15,
                    "max_capacity": 80,
                    "description": "Explore network vulnerability analysis, web application penetration testing, and defensive security measures.",
                    "status": "CLOSED"
                }
            ]

            created_events = []
            for ed in events_data:
                ev = Event(**ed)
                db.add(ev)
                created_events.append(ev)
            db.commit()
            print(f"[OK] Seeded {len(created_events)} sample events")

            # 3. Seed Realistic Attendance for Past Events
            depts = ["Computer Engineering", "Information Technology", "AI & Data Science", "EXTC"]
            years = ["FE", "SE", "TE", "BE"]
            divisions = ["A", "B", "C"]
            names = [
                ("Aarav Sharma", "2023COMP001", "01"),
                ("Ananya Patel", "2023COMP002", "02"),
                ("Rohan Verma", "2023IT014", "14"),
                ("Priya Nair", "2023AIDS022", "22"),
                ("Siddharth Gupta", "2022COMP045", "45"),
                ("Isha Deshmukh", "2022EXTC012", "12"),
                ("Aditya Kulkarni", "2024COMP008", "08"),
                ("Neha Joshi", "2023IT033", "33"),
                ("Vikram Singh", "2022AIDS050", "50"),
                ("Tanvi Mehta", "2023COMP062", "62")
            ]

            closed_events = db.query(Event).filter(Event.status == "CLOSED").all()
            total_att = 0
            for ev in closed_events:
                for idx, (name, gr, roll) in enumerate(names, start=1):
                    dept = depts[idx % len(depts)]
                    yr = years[idx % len(years)]
                    sem = 6 if yr == "TE" else (4 if yr == "SE" else 2)
                    div = divisions[idx % len(divisions)]
                    is_manual = (idx % 4 == 0)

                    att = Attendance(
                        event_id=ev.id,
                        student_name=name,
                        gr_number=f"{ev.id}_{gr}",
                        roll_number=roll,
                        department=dept,
                        year=yr,
                        semester=sem,
                        class_name=f"{dept} - {yr}",
                        division=div,
                        mobile=f"98765432{idx:02d}",
                        submission_time=datetime.utcnow() - timedelta(hours=idx),
                        verification_status="MANUAL" if is_manual else "VERIFIED",
                        submission_method="MANUAL_ADMIN" if is_manual else "QR_DYNAMIC",
                        ip_address=f"192.168.1.{10+idx}",
                        device_fingerprint=f"fp_mock_{idx}_hash",
                        manual_entry=is_manual,
                        marked_by=f"Admin (admin)" if is_manual else "Self (QR Scan)"
                    )
                    db.add(att)
                    total_att += 1
            db.commit()
            print(f"[OK] Seeded {total_att} sample attendance records")

        # 4. Seed Audit Logs
        existing_logs = db.query(AuditLog).count()
        if existing_logs == 0:
            sample_logs = [
                AuditLog(action="SYSTEM_INIT", performed_by="System", details="Database initialized and seeded"),
                AuditLog(action="LOGIN_SUCCESS", performed_by="admin", ip_address="127.0.0.1", details="Admin login successful"),
                AuditLog(action="EVENT_CREATED", performed_by="admin", ip_address="127.0.0.1", details="Created event 'Full-Stack Web Development Workshop'"),
                AuditLog(action="ATTENDANCE_STARTED", performed_by="admin", ip_address="127.0.0.1", details="Started attendance session for event ID 1")
            ]
            for lg in sample_logs:
                db.add(lg)
            db.commit()
            print("[OK] Seeded initial audit logs")

        print("Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error during seeding: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
