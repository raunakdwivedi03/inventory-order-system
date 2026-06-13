from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas, crud, database
from app.database import engine, get_db

# Create database tables (simple migration)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management System API",
    description="Backend API for managing products, customers, orders, and stock levels.",
    version="1.0.0"
)

# CORS Configuration
origins = database.settings.CORS_ORIGINS.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Helper Mappers ====================

def map_order_to_out(order: models.Order) -> schemas.OrderOut:
    return schemas.OrderOut(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.full_name if order.customer else "Unknown Customer",
        total_amount=order.total_amount,
        created_at=order.created_at,
        items=[
            schemas.OrderItemOut(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product.name if item.product else "Unknown Product",
                quantity=item.quantity,
                price_per_unit=item.price_per_unit
            ) for item in order.items
        ]
    )


# ==================== Product Routes ====================

@app.post("/products", response_model=schemas.ProductOut, status_code=status.HTTP_201_CREATED, tags=["Products"])
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db, product)

@app.get("/products", response_model=List[schemas.ProductOut], tags=["Products"])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_products(db, skip=skip, limit=limit)

@app.get("/products/{product_id}", response_model=schemas.ProductOut, tags=["Products"])
def read_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud.get_product(db, product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@app.put("/products/{product_id}", response_model=schemas.ProductOut, tags=["Products"])
def update_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db)):
    return crud.update_product(db, product_id, product)

@app.delete("/products/{product_id}", response_model=schemas.ProductOut, tags=["Products"])
def delete_product(product_id: int, db: Session = Depends(get_db)):
    return crud.delete_product(db, product_id)


# ==================== Customer Routes ====================

@app.post("/customers", response_model=schemas.CustomerOut, status_code=status.HTTP_201_CREATED, tags=["Customers"])
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    return crud.create_customer(db, customer)

@app.get("/customers", response_model=List[schemas.CustomerOut], tags=["Customers"])
def read_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_customers(db, skip=skip, limit=limit)

@app.get("/customers/{customer_id}", response_model=schemas.CustomerOut, tags=["Customers"])
def read_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = crud.get_customer(db, customer_id)
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer

@app.delete("/customers/{customer_id}", response_model=schemas.CustomerOut, tags=["Customers"])
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    return crud.delete_customer(db, customer_id)


# ==================== Order Routes ====================

@app.post("/orders", response_model=schemas.OrderOut, status_code=status.HTTP_201_CREATED, tags=["Orders"])
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    created_order = crud.create_order(db, order)
    return map_order_to_out(created_order)

@app.get("/orders", response_model=List[schemas.OrderOut], tags=["Orders"])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    orders = crud.get_orders(db, skip=skip, limit=limit)
    return [map_order_to_out(order) for order in orders]

@app.get("/orders/{order_id}", response_model=schemas.OrderOut, tags=["Orders"])
def read_order(order_id: int, db: Session = Depends(get_db)):
    db_order = crud.get_order(db, order_id)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    return map_order_to_out(db_order)

@app.delete("/orders/{order_id}", response_model=schemas.OrderOut, tags=["Orders"])
def delete_order(order_id: int, db: Session = Depends(get_db)):
    deleted_order = crud.delete_order(db, order_id)
    return map_order_to_out(deleted_order)


# ==================== Dashboard Routes ====================

@app.get("/dashboard/stats", response_model=schemas.DashboardStats, tags=["Dashboard"])
def read_dashboard_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)


# ==================== Root Health Route ====================

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "Inventory & Order Management System API"
    }
