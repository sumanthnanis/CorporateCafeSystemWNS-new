#!/usr/bin/env python3
"""
Script to add comprehensive dummy data to the corporate food ordering system.
This will add more menu items, sample orders, and ensure all cafes have proper menus.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services', 'user-service'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User, UserType, Cafe, Category, MenuItem, Order, OrderItem, OrderStatus
from auth import get_password_hash
from datetime import datetime, timedelta
import random

# Database configuration - use the shared database
DATABASE_URL = "sqlite:///./shared_microservices.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create all tables
Base.metadata.create_all(bind=engine)

def add_comprehensive_menu_items():
    """Add comprehensive menu items for all cafes."""
    db = SessionLocal()
    
    try:
        # Get all cafes and categories
        cafes = db.query(Cafe).all()
        categories = db.query(Category).all()
        
        # Create dictionaries for easy lookup
        cafe_dict = {cafe.name: cafe for cafe in cafes}
        category_dict = {cat.name: cat for cat in categories}
        
        # Comprehensive menu items for each cafe
        menu_items = [
            # Coffee Central - Premium coffee and breakfast
            ("Coffee Central", "Americano", "Rich black coffee with hot water", 3.25, 40, 80, "Coffee & Tea", 10),
            ("Coffee Central", "Latte", "Espresso with steamed milk", 4.50, 35, 60, "Coffee & Tea", 12),
            ("Coffee Central", "Mocha", "Chocolate espresso with steamed milk", 5.25, 25, 45, "Coffee & Tea", 15),
            ("Coffee Central", "Bagel with Cream Cheese", "Fresh bagel with cream cheese", 3.75, 30, 50, "Breakfast", 8),
            ("Coffee Central", "Blueberry Muffin", "Fresh baked blueberry muffin", 2.95, 25, 40, "Breakfast", 5),
            ("Coffee Central", "Breakfast Sandwich", "Egg, cheese, and bacon on English muffin", 6.50, 20, 35, "Breakfast", 12),
            ("Coffee Central", "Danish Pastry", "Buttery pastry with fruit filling", 3.50, 15, 30, "Desserts", 7),
            
            # Quick Lunch - Fast and healthy options
            ("Quick Lunch", "Grilled Chicken Salad", "Mixed greens with grilled chicken", 8.95, 18, 30, "Salads", 15),
            ("Quick Lunch", "BLT Sandwich", "Bacon, lettuce, tomato on toasted bread", 7.25, 22, 35, "Sandwiches", 10),
            ("Quick Lunch", "Club Sandwich", "Turkey, ham, bacon triple-decker", 9.50, 15, 25, "Sandwiches", 18),
            ("Quick Lunch", "Soup of the Day", "Daily fresh soup selection", 4.75, 30, 50, "Main Dishes", 8),
            ("Quick Lunch", "Chicken Wrap", "Grilled chicken with vegetables", 7.95, 20, 35, "Sandwiches", 12),
            ("Quick Lunch", "Fruit Smoothie", "Fresh fruit blend", 5.25, 25, 40, "Beverages", 5),
            
            # Fresh & Green - Organic and healthy
            ("Fresh & Green", "Organic Caesar Salad", "Organic romaine with parmesan", 9.75, 20, 30, "Salads", 12),
            ("Fresh & Green", "Vegan Buddha Bowl", "Quinoa, vegetables, tahini dressing", 11.50, 15, 25, "Main Dishes", 20),
            ("Fresh & Green", "Acai Bowl", "Acai berries with granola and fruit", 8.25, 12, 20, "Breakfast", 10),
            ("Fresh & Green", "Avocado Toast Deluxe", "Multigrain bread with avocado and seeds", 9.50, 18, 30, "Breakfast", 15),
            ("Fresh & Green", "Detox Juice", "Green vegetable and fruit juice", 6.95, 20, 35, "Beverages", 8),
            ("Fresh & Green", "Raw Energy Balls", "Dates, nuts, and seeds", 4.50, 25, 40, "Snacks", 5),
            
            # International Flavors - Diverse cuisine
            ("International Flavors", "Chicken Curry", "Mild curry with basmati rice", 12.95, 12, 20, "Main Dishes", 25),
            ("International Flavors", "Beef Stir Fry", "Asian-style beef with vegetables", 13.50, 10, 18, "Main Dishes", 20),
            ("International Flavors", "Vegetable Samosas", "Crispy pastries with spiced vegetables", 5.95, 20, 35, "Snacks", 12),
            ("International Flavors", "Ramen Bowl", "Japanese noodle soup", 10.75, 15, 25, "Main Dishes", 18),
            ("International Flavors", "Tacos (3 pieces)", "Soft shell tacos with choice of filling", 8.95, 25, 40, "Main Dishes", 15),
            ("International Flavors", "Bubble Tea", "Taiwanese tea with tapioca pearls", 4.75, 30, 50, "Beverages", 8),
            
            # Sweet Treats - Desserts and drinks
            ("Sweet Treats", "Chocolate Chip Cookies", "Fresh baked cookies (3 pieces)", 3.25, 40, 60, "Desserts", 5),
            ("Sweet Treats", "Cheesecake Slice", "New York style cheesecake", 5.95, 12, 20, "Desserts", 10),
            ("Sweet Treats", "Fruit Tart", "Seasonal fruit on pastry cream", 4.75, 15, 25, "Desserts", 12),
            ("Sweet Treats", "Hot Chocolate", "Rich chocolate with whipped cream", 3.95, 35, 50, "Beverages", 8),
            ("Sweet Treats", "Milkshake", "Vanilla, chocolate, or strawberry", 5.50, 20, 35, "Beverages", 10),
            ("Sweet Treats", "Cinnamon Roll", "Warm cinnamon roll with glaze", 4.25, 18, 30, "Desserts", 15),
        ]
        
        items_added = 0
        for cafe_name, item_name, description, price, avail_qty, max_qty, category_name, prep_time in menu_items:
            # Check if item already exists
            existing_item = db.query(MenuItem).filter(
                MenuItem.name == item_name,
                MenuItem.cafe_id == cafe_dict[cafe_name].id
            ).first()
            
            if existing_item:
                continue
                
            # Create menu item
            menu_item = MenuItem(
                name=item_name,
                description=description,
                price=price,
                available_quantity=avail_qty,
                max_daily_quantity=max_qty,
                cafe_id=cafe_dict[cafe_name].id,
                category_id=category_dict[category_name].id,
                is_available=True,
                preparation_time=prep_time
            )
            db.add(menu_item)
            items_added += 1
            print(f"Added {item_name} to {cafe_name}")
        
        db.commit()
        print(f"\n✅ Added {items_added} new menu items to cafes!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error adding menu items: {e}")
        raise
    finally:
        db.close()

def add_sample_orders():
    """Add sample orders to demonstrate the system."""
    db = SessionLocal()
    
    try:
        # Get employees and cafes
        employees = db.query(User).filter(User.user_type == UserType.EMPLOYEE).all()
        cafes = db.query(Cafe).all()
        
        if not employees or not cafes:
            print("No employees or cafes found, skipping order creation")
            return
        
        # Create sample orders
        orders_data = [
            {
                "customer": employees[0],
                "cafe": cafes[0],
                "status": OrderStatus.DELIVERED,
                "total": 12.75,
                "items": [
                    {"name": "Latte", "qty": 1, "price": 4.50},
                    {"name": "Breakfast Sandwich", "qty": 1, "price": 6.50},
                    {"name": "Danish Pastry", "qty": 1, "price": 1.75}
                ]
            },
            {
                "customer": employees[1] if len(employees) > 1 else employees[0],
                "cafe": cafes[1] if len(cafes) > 1 else cafes[0],
                "status": OrderStatus.PREPARING,
                "total": 16.20,
                "items": [
                    {"name": "Club Sandwich", "qty": 1, "price": 9.50},
                    {"name": "Fruit Smoothie", "qty": 1, "price": 5.25},
                    {"name": "Soup of the Day", "qty": 1, "price": 1.45}
                ]
            },
            {
                "customer": employees[2] if len(employees) > 2 else employees[0],
                "cafe": cafes[2] if len(cafes) > 2 else cafes[0],
                "status": OrderStatus.READY,
                "total": 19.75,
                "items": [
                    {"name": "Vegan Buddha Bowl", "qty": 1, "price": 11.50},
                    {"name": "Detox Juice", "qty": 1, "price": 6.95},
                    {"name": "Raw Energy Balls", "qty": 1, "price": 1.30}
                ]
            }
        ]
        
        orders_added = 0
        for order_data in orders_data:
            # Generate order number
            order_number = f"ORD-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
            
            # Create order
            order = Order(
                order_number=order_number,
                total_amount=order_data["total"],
                status=order_data["status"],
                customer_id=order_data["customer"].id,
                cafe_id=order_data["cafe"].id,
                payment_status="completed",
                payment_method="credit_card",
                special_instructions="Sample order for testing",
                estimated_preparation_time=15,
                created_at=datetime.now() - timedelta(days=random.randint(1, 7))
            )
            
            db.add(order)
            db.flush()  # Get the ID
            
            # Add order items
            for item_data in order_data["items"]:
                # Find the menu item
                menu_item = db.query(MenuItem).filter(
                    MenuItem.name == item_data["name"],
                    MenuItem.cafe_id == order_data["cafe"].id
                ).first()
                
                if menu_item:
                    order_item = OrderItem(
                        order_id=order.id,
                        menu_item_id=menu_item.id,
                        quantity=item_data["qty"],
                        unit_price=item_data["price"],
                        total_price=item_data["price"] * item_data["qty"]
                    )
                    db.add(order_item)
            
            orders_added += 1
            print(f"Added order {order_number} for {order_data['customer'].username}")
        
        db.commit()
        print(f"\n✅ Added {orders_added} sample orders!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error adding orders: {e}")
        raise
    finally:
        db.close()

def main():
    """Main function to add all comprehensive data."""
    print("🚀 Adding comprehensive dummy data to the food ordering system...")
    
    add_comprehensive_menu_items()
    add_sample_orders()
    
    print("\n✅ Comprehensive data addition complete!")
    print("\nData Summary:")
    
    # Print summary
    db = SessionLocal()
    try:
        cafe_count = db.query(Cafe).count()
        menu_count = db.query(MenuItem).count()
        category_count = db.query(Category).count()
        order_count = db.query(Order).count()
        user_count = db.query(User).count()
        
        print(f"   - {cafe_count} cafes")
        print(f"   - {category_count} categories")
        print(f"   - {menu_count} menu items")
        print(f"   - {order_count} orders")
        print(f"   - {user_count} users")
    finally:
        db.close()

if __name__ == "__main__":
    main()