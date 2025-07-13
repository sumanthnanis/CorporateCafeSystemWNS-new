#!/usr/bin/env python3
"""
Script to add employee users to the shared microservices database.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services', 'user-service'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User, UserType
from auth import get_password_hash

# Database configuration - use the shared database
DATABASE_URL = "sqlite:///./shared_microservices.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create all tables
Base.metadata.create_all(bind=engine)

def add_employees():
    """Add employee users to the database."""
    db = SessionLocal()
    
    try:
        # Employee data
        employees = [
            ("employee1@company.com", "employee1", "John Employee", "password123"),
            ("employee2@company.com", "employee2", "Jane Employee", "password123"),
            ("employee3@company.com", "employee3", "Mike Employee", "password123"),
            ("employee4@company.com", "employee4", "Sarah Employee", "password123"),
            ("employee5@company.com", "employee5", "David Employee", "password123"),
            ("employee6@company.com", "employee6", "Lisa Employee", "password123"),
            ("employee7@company.com", "employee7", "Tom Employee", "password123"),
            ("employee8@company.com", "employee8", "Emma Employee", "password123"),
        ]
        
        employees_added = 0
        for email, username, full_name, password in employees:
            # Check if user already exists
            existing_user = db.query(User).filter(User.username == username).first()
            if existing_user:
                print(f"User {username} already exists, skipping.")
                continue
            
            user = User(
                email=email,
                username=username,
                full_name=full_name,
                hashed_password=get_password_hash(password),
                user_type=UserType.EMPLOYEE,
                is_active=True
            )
            db.add(user)
            employees_added += 1
            print(f"Added employee: {username}")
        
        db.commit()
        print(f"\n✅ Successfully added {employees_added} employees to the database!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error adding employees: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Adding employee users to shared database...")
    add_employees()
    print("✅ Employee addition complete!")