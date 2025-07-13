#!/usr/bin/env python3
"""
Script to add dummy data to the corporate food ordering system database.
This will create sample users, cafes, menu items, and orders for testing.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services', 'user-service'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User, UserType
from auth import get_password_hash

# Database configuration
DATABASE_URL = "sqlite:///./test_auth.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_dummy_users():
    """Create dummy users for testing."""
    db = SessionLocal()
    
    try:
        # Check if users already exist
        existing_users = db.query(User).count()
        if existing_users > 0:
            print(f"Found {existing_users} existing users. Skipping user creation.")
            return
        
        # Create sample cafe owners
        cafe_owners = [
            {
                "email": "owner1@company.com",
                "username": "cafeowner1",
                "password": "password123",
                "full_name": "John Smith",
                "user_type": UserType.CAFE_OWNER
            },
            {
                "email": "owner2@company.com", 
                "username": "cafeowner2",
                "password": "password123",
                "full_name": "Sarah Johnson",
                "user_type": UserType.CAFE_OWNER
            },
            {
                "email": "owner3@company.com",
                "username": "cafeowner3", 
                "password": "password123",
                "full_name": "Mike Davis",
                "user_type": UserType.CAFE_OWNER
            }
        ]
        
        # Create sample employees
        employees = [
            {
                "email": "emp1@company.com",
                "username": "employee1",
                "password": "password123", 
                "full_name": "Alice Brown",
                "user_type": UserType.EMPLOYEE
            },
            {
                "email": "emp2@company.com",
                "username": "employee2",
                "password": "password123",
                "full_name": "Bob Wilson",
                "user_type": UserType.EMPLOYEE
            },
            {
                "email": "emp3@company.com",
                "username": "employee3",
                "password": "password123",
                "full_name": "Carol Martinez",
                "user_type": UserType.EMPLOYEE
            },
            {
                "email": "emp4@company.com",
                "username": "employee4", 
                "password": "password123",
                "full_name": "David Garcia",
                "user_type": UserType.EMPLOYEE
            }
        ]
        
        all_users = cafe_owners + employees
        
        for user_data in all_users:
            # Hash the password
            hashed_password = get_password_hash(user_data["password"])
            
            user = User(
                email=user_data["email"],
                username=user_data["username"],
                hashed_password=hashed_password,
                full_name=user_data["full_name"],
                user_type=user_data["user_type"]
            )
            
            db.add(user)
            print(f"Created user: {user_data['username']} ({user_data['user_type'].value})")
        
        db.commit()
        print(f"\nSuccessfully created {len(all_users)} users!")
        print("\n--- Login Credentials ---")
        print("Cafe Owners:")
        for owner in cafe_owners:
            print(f"  Username: {owner['username']} | Password: {owner['password']} | Name: {owner['full_name']}")
        print("\nEmployees:")
        for emp in employees:
            print(f"  Username: {emp['username']} | Password: {emp['password']} | Name: {emp['full_name']}")
            
    except Exception as e:
        db.rollback()
        print(f"Error creating users: {e}")
    finally:
        db.close()

def main():
    """Main function to create all dummy data."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    print("Adding dummy data...")
    create_dummy_users()
    
    print("\nDummy data creation complete!")
    print("\nYou can now test the application with these accounts:")
    print("- All passwords are: password123")
    print("- Cafe owners can create cafes and manage menus")
    print("- Employees can browse cafes and place orders")

if __name__ == "__main__":
    main()