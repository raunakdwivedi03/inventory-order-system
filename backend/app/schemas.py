from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import List, Optional
from datetime import datetime

# ==================== Product Schemas ====================

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    sku: str = Field(..., min_length=1, max_length=50)
    price: float = Field(..., ge=0.0, description="Product price must be non-negative")
    quantity_in_stock: int = Field(..., ge=0, description="Stock quantity must be non-negative")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    sku: Optional[str] = Field(None, min_length=1, max_length=50)
    price: Optional[float] = Field(None, ge=0.0)
    quantity_in_stock: Optional[int] = Field(None, ge=0)

class ProductOut(ProductBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ==================== Customer Schemas ====================

class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone_number: str = Field(..., min_length=5, max_length=25)

class CustomerCreate(CustomerBase):
    pass

class CustomerOut(CustomerBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ==================== Order Item Schemas ====================

class OrderItemCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0, description="Order quantity must be greater than zero")

class OrderItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    price_per_unit: float
    model_config = ConfigDict(from_attributes=True)


# ==================== Order Schemas ====================

class OrderCreate(BaseModel):
    customer_id: int = Field(..., gt=0)
    items: List[OrderItemCreate] = Field(..., min_length=1, description="Order must contain at least one product")

class OrderOut(BaseModel):
    id: int
    customer_id: int
    customer_name: str
    total_amount: float
    created_at: datetime
    items: List[OrderItemOut]
    model_config = ConfigDict(from_attributes=True)


# ==================== Dashboard Schemas ====================

class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: List[ProductOut]
