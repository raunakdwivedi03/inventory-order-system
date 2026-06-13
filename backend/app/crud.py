from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app import models, schemas

# ==================== Product CRUD ====================

def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).order_by(models.Product.id.desc()).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    # Check if SKU already exists
    db_product = get_product_by_sku(db, product.sku)
    if db_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product.sku}' already exists."
        )
    
    new_product = models.Product(
        name=product.name,
        sku=product.sku,
        price=product.price,
        quantity_in_stock=product.quantity_in_stock
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    update_data = product_update.model_dump(exclude_unset=True)
    
    # Check if SKU is changing and if new SKU is already taken
    if "sku" in update_data and update_data["sku"] != db_product.sku:
        duplicate = get_product_by_sku(db, update_data["sku"])
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with SKU '{update_data['sku']}' already exists."
            )

    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    db.delete(db_product)
    db.commit()
    return db_product


# ==================== Customer CRUD ====================

def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).order_by(models.Customer.id.desc()).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    # Check if Email already exists
    db_customer = get_customer_by_email(db, customer.email)
    if db_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with email '{customer.email}' already registered."
        )
    
    new_customer = models.Customer(
        full_name=customer.full_name,
        email=customer.email,
        phone_number=customer.phone_number
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    db.delete(db_customer)
    db.commit()
    return db_customer


# ==================== Order CRUD ====================

def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).order_by(models.Order.id.desc()).offset(skip).limit(limit).all()

def create_order(db: Session, order_data: schemas.OrderCreate):
    # 1. Verify Customer exists
    customer = get_customer(db, order_data.customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {order_data.customer_id} does not exist."
        )

    # 2. Begin Transaction
    # To manage transactional consistency, we will work with db.begin_nested() or just commit at the end.
    # If any exception is raised, the router level transaction rolls back.
    total_amount = 0.0
    order_items_to_create = []

    # Map items to prevent duplicate products in same order input
    product_quantities = {}
    for item in order_data.items:
        product_quantities[item.product_id] = product_quantities.get(item.product_id, 0) + item.quantity

    for product_id, quantity in product_quantities.items():
        # Fetch product
        product = db.query(models.Product).with_for_update().filter(models.Product.id == product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found."
            )
        
        # Check stock
        if product.quantity_in_stock < quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient inventory for product '{product.name}'. Requested {quantity}, but only {product.quantity_in_stock} available."
            )
        
        # Deduct stock
        product.quantity_in_stock -= quantity
        
        # Calculate amount
        item_total = product.price * quantity
        total_amount += item_total

        # Prepare OrderItem
        order_item = models.OrderItem(
            product_id=product.id,
            quantity=quantity,
            price_per_unit=product.price
        )
        order_items_to_create.append(order_item)

    # 3. Create the Order
    new_order = models.Order(
        customer_id=customer.id,
        total_amount=total_amount,
        items=order_items_to_create
    )
    
    db.add(new_order)
    try:
        db.commit()
        db.refresh(new_order)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save order: {str(e)}"
        )
        
    return new_order

def delete_order(db: Session, order_id: int):
    # Deleting or cancelling an order. 
    # Note: We should refund the stock when an order is cancelled/deleted!
    # Let's write this logic: for each item in the order, add back to product stock.
    db_order = get_order(db, order_id)
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Refund stock
    for item in db_order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            product.quantity_in_stock += item.quantity
            
    db.delete(db_order)
    db.commit()
    return db_order


# ==================== Dashboard Stats CRUD ====================

def get_dashboard_stats(db: Session):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    
    # Low stock is defined as < 10 units in stock
    low_stock_products = db.query(models.Product).filter(models.Product.quantity_in_stock < 10).all()
    
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_products": low_stock_products
    }
