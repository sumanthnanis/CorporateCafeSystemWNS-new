from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import enum

Base = declarative_base()

class UserType(enum.Enum):
    CAFE_OWNER = "CAFE_OWNER"
    EMPLOYEE = "EMPLOYEE"
    SUPER_ADMIN = "SUPER_ADMIN"

class OrderStatus(enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    PREPARING = "PREPARING"
    READY = "READY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    user_type = Column(Enum(UserType), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    owned_cafes = relationship("Cafe", back_populates="owner")
    orders = relationship("Order", back_populates="customer")
    feedbacks = relationship("OrderFeedback", back_populates="customer")

class Cafe(Base):
    __tablename__ = "cafes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    address = Column(String)
    phone = Column(String)
    is_active = Column(Boolean, default=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="owned_cafes")
    menu_items = relationship("MenuItem", back_populates="cafe")
    orders = relationship("Order", back_populates="cafe")
    feedbacks = relationship("OrderFeedback", back_populates="cafe")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    menu_items = relationship("MenuItem", back_populates="category")

class MenuItem(Base):
    __tablename__ = "menu_items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    available_quantity = Column(Integer, default=0)
    max_daily_quantity = Column(Integer, default=0)
    is_available = Column(Boolean, default=True)
    preparation_time = Column(Integer, default=15)  # in minutes
    cafe_id = Column(Integer, ForeignKey("cafes.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    cafe = relationship("Cafe", back_populates="menu_items")
    category = relationship("Category", back_populates="menu_items")
    order_items = relationship("OrderItem", back_populates="menu_item")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    estimated_preparation_time = Column(Integer)  # in minutes
    special_instructions = Column(Text)
    payment_status = Column(String, default="pending")  # 'pending', 'completed', 'failed'
    payment_method = Column(String)  # 'credit_card', 'paypal', etc.
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cafe_id = Column(Integer, ForeignKey("cafes.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = relationship("User", back_populates="orders")
    cafe = relationship("Cafe", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order")
    feedback = relationship("OrderFeedback", back_populates="order", uselist=False)

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    special_instructions = Column(Text)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    
    # Relationships
    order = relationship("Order", back_populates="order_items")
    menu_item = relationship("MenuItem", back_populates="order_items")

class OrderFeedback(Base):
    __tablename__ = "order_feedbacks"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cafe_id = Column(Integer, ForeignKey("cafes.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    feedback_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    order = relationship("Order", back_populates="feedback")
    customer = relationship("User", back_populates="feedbacks")
    cafe = relationship("Cafe", back_populates="feedbacks")