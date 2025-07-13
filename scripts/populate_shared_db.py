#!/usr/bin/env python3
"""
Script to populate the shared microservices database with sample data.
This creates users, cafes, menu items, and categories for testing.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services', 'user-service'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User, UserType, Cafe, Category, MenuItem
from auth import get_password_hash
from datetime import datetime

# Database configuration - use the shared database
DATABASE_URL = "sqlite:///./shared_microservices.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create all tables
Base.metadata.create_all(bind=engine)

def create_users_and_cafes():
    """Create sample users and cafes."""
    db = SessionLocal()
    
    try:
        # Check if cafes already exist
        existing_cafes = db.query(Cafe).count()
        if existing_cafes > 0:
            print(f"Found {existing_cafes} existing cafes. Data already populated.")
            return
        
        # Create cafe owners
        cafe_owners = []
        owner_data = [
            ("alice@company.com", "alice", "Alice Cooper", "password123"),
            ("bob@company.com", "bob", "Bob Smith", "password123"),
            ("carol@company.com", "carol", "Carol Johnson", "password123"),
            ("sum1@company.com", "sum1", "Summer Williams", "password123"),
            ("anil@company.com", "anil", "Anil Patel", "password123"),
        ]
        
        for email, username, full_name, password in owner_data:
            # Check if user already exists
            existing_user = db.query(User).filter(User.username == username).first()
            if existing_user:
                cafe_owners.append(existing_user)
                print(f"User {username} already exists, using existing user.")
            else:
                user = User(
                    email=email,
                    username=username,
                    full_name=full_name,
                    hashed_password=get_password_hash(password),
                    user_type=UserType.CAFE_OWNER,
                    is_active=True
                )
                db.add(user)
                db.flush()  # Get the ID
                cafe_owners.append(user)
                print(f"Created cafe owner: {username}")
        
        # Create cafes
        cafe_data = [
            ("Coffee Central", "Premium coffee and breakfast items", "Building A, Floor 1", "555-0101", cafe_owners[0]),
            ("Quick Lunch", "Fast and healthy lunch options", "Building B, Floor 2", "555-0102", cafe_owners[1]),
            ("Fresh & Green", "Organic salads and healthy meals", "Building A, Floor 3", "555-0103", cafe_owners[0]),
            ("International Flavors", "Diverse international cuisine", "Building C, Floor 1", "555-0104", cafe_owners[2]),
            ("Sweet Treats", "Desserts and specialty drinks", "Building A, Floor 2", "555-0105", cafe_owners[0]),
        ]
        
        cafes = []
        for name, description, address, phone, owner in cafe_data:
            cafe = Cafe(
                name=name,
                description=description,
                address=address,
                phone=phone,
                owner_id=owner.id,
                is_active=True
            )
            db.add(cafe)
            db.flush()
            cafes.append(cafe)
            print(f"Created cafe: {name}")
        
        # Create categories
        category_data = [
            ("Coffee & Tea", "Hot and cold beverages"),
            ("Breakfast", "Morning meals and pastries"),
            ("Sandwiches", "Fresh sandwiches and wraps"),
            ("Salads", "Fresh and healthy salads"),
            ("Main Dishes", "Hearty lunch and dinner options"),
            ("Desserts", "Sweet treats and pastries"),
            ("Snacks", "Light snacks and appetizers"),
            ("Beverages", "Non-coffee drinks and juices"),
        ]
        
        categories = []
        for name, description in category_data:
            category = Category(
                name=name,
                description=description
            )
            db.add(category)
            db.flush()
            categories.append(category)
            print(f"Created category: {name}")
        
        # Create menu items
        menu_items = [
            # Coffee Central items
            ("Espresso", "Rich and bold espresso shot", 3.50, 50, 100, cafes[0], categories[0]),
            ("Cappuccino", "Espresso with steamed milk foam", 4.25, 30, 50, cafes[0], categories[0]),
            ("Croissant", "Buttery French pastry", 2.75, 20, 40, cafes[0], categories[1]),
            ("Avocado Toast", "Sourdough with fresh avocado", 8.50, 15, 25, cafes[0], categories[1]),
            
            # Quick Lunch items
            ("Turkey Sandwich", "Sliced turkey with lettuce and tomato", 7.95, 25, 40, cafes[1], categories[2]),
            ("Chicken Caesar Salad", "Grilled chicken with romaine lettuce", 9.25, 20, 30, cafes[1], categories[3]),
            ("Veggie Wrap", "Fresh vegetables in a whole wheat wrap", 6.75, 18, 35, cafes[1], categories[2]),
            
            # Fresh & Green items
            ("Quinoa Bowl", "Healthy quinoa with vegetables", 10.50, 12, 20, cafes[2], categories[4]),
            ("Kale Salad", "Massaged kale with lemon dressing", 8.75, 15, 25, cafes[2], categories[3]),
            ("Green Smoothie", "Spinach, banana, and apple blend", 5.95, 10, 20, cafes[2], categories[7]),
            
            # International Flavors items
            ("Chicken Tikka", "Spiced grilled chicken", 12.95, 8, 15, cafes[3], categories[4]),
            ("Pad Thai", "Traditional Thai noodles", 11.50, 10, 18, cafes[3], categories[4]),
            ("Miso Soup", "Traditional Japanese soup", 4.25, 20, 30, cafes[3], categories[6]),
            
            # Sweet Treats items
            ("Chocolate Cake", "Rich chocolate layer cake", 4.95, 12, 20, cafes[4], categories[5]),
            ("Blueberry Muffin", "Fresh blueberry muffin", 3.25, 25, 40, cafes[4], categories[5]),
            ("Iced Coffee", "Cold brew with milk", 3.75, 30, 50, cafes[4], categories[0]),
        ]
        
        for name, description, price, available_qty, max_daily_qty, cafe, category in menu_items:
            item = MenuItem(
                name=name,
                description=description,
                price=price,
                available_quantity=available_qty,
                max_daily_quantity=max_daily_qty,
                cafe_id=cafe.id,
                category_id=category.id,
                is_available=True,
                preparation_time=15
            )
            db.add(item)
            print(f"Created menu item: {name} for {cafe.name}")
        
        db.commit()
        print(f"\n✅ Successfully populated database with:")
        print(f"   - {len(cafe_owners)} cafe owners")
        print(f"   - {len(cafes)} cafes")
        print(f"   - {len(categories)} categories")
        print(f"   - {len(menu_items)} menu items")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error populating database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Populating shared microservices database...")
    create_users_and_cafes()
    print("✅ Database population complete!")