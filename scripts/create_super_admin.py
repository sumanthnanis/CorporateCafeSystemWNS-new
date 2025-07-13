#!/usr/bin/env python3
"""
Script to create a super admin user for the corporate food ordering system.
"""
import sqlite3
import bcrypt
from datetime import datetime

def create_super_admin():
    """Create a super admin user."""
    db_path = 'shared_microservices.db'
    
    # Super admin details
    email = 'admin@foodflow.com'
    username = 'admin'
    full_name = 'System Administrator'
    password = 'admin123'
    
    # Hash the password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if super admin already exists
        cursor.execute("SELECT id FROM users WHERE email = ? OR username = ?", (email, username))
        if cursor.fetchone():
            print(f"Super admin user '{username}' already exists!")
            return
        
        # Create super admin user
        cursor.execute("""
            INSERT INTO users (email, username, hashed_password, full_name, user_type, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (email, username, hashed_password, full_name, 'SUPER_ADMIN', True, datetime.utcnow()))
        
        conn.commit()
        print(f"Super admin user created successfully!")
        print(f"Email: {email}")
        print(f"Username: {username}")
        print(f"Password: {password}")
        print(f"User Type: SUPER_ADMIN")
        
    except sqlite3.Error as e:
        print(f"Error creating super admin user: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    create_super_admin()