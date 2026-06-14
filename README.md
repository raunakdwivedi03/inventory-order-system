# FlowStock - Inventory & Order Management System

FlowStock is a production-ready, containerized, full-stack Inventory & Order Management System designed for modern businesses to manage product catalogs, track customer directories, and process sales checkout orders with automated stock level adjustments.

---

## 🚀 Key Features

*   **KPI Dashboard:** Real-time summary counts of products, customers, and orders, along with automatic alerts for low-stock items (< 10 units).
*   **Product Catalog:** Complete CRUD capabilities, unique SKU validation, and non-negative pricing/stock requirements.
*   **Customer Directory:** Registration form with contact details and unique email validations.
*   **Transactional Sales checkout:** Multi-product order creation page with real-time running subtotal calculations. Insufficient stock levels block orders on the database layer and roll back transactions.
*   **Docker Orchestrated:** Configured multi-container environment (Frontend, Backend, Postgres Database) runnable with a single command.

---

## 🛠️ Tech Stack

*   **Frontend:** React (Vite), Axios, Lucide Icons, Vanilla CSS
*   **Backend:** Python 3.11, FastAPI, SQLAlchemy ORM, Pydantic V2
*   **Database:** PostgreSQL 15 (Alpine)
*   **Containerization:** Docker & Docker Compose

---

## 📁 Directory Structure

```text
D:\inventory-order-system/
│
├── backend/
│   ├── app/
│   │   ├── config.py          # Settings & Environment variables parser
│   │   ├── database.py        # SQLAlchemy engine and session pool
│   │   ├── models.py          # Postgres DB Table definitions
│   │   ├── schemas.py         # Pydantic validation schemas
│   │   ├── crud.py            # DB operations & Transactional order business logic
│   │   └── main.py            # API Routes and FastAPI instance
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile             # Multi-stage lightweight python runner
│   └── .dockerignore          # Ignore cache/venv files
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx  # Metrics overview & Low stock warnings
│   │   │   ├── Products.jsx   # Product list and CRUD operations
│   │   │   ├── Customers.jsx  # Customer list and Registration
│   │   │   └── Orders.jsx     # Checkout drawer & Invoice details
│   │   ├── App.jsx            # Routing, Layout, and healthcheck banner
│   │   ├── main.jsx           # Mount react
│   │   └── index.css          # Slate/indigo/teal UI layout
│   ├── nginx.conf             # Production SPA router configuration
│   ├── index.html             # Document entry point
│   ├── package.json           # Frontend packages
│   ├── vite.config.js         # Development server settings
│   ├── Dockerfile             # Production multi-stage node builder & Nginx runner
│   └── .dockerignore          # Ignore build cache and modules
│
├── docker-compose.yml         # Container orchestration manifest
├── .env.example               # Environmental configurations template
└── README.md                  # System Documentation (This file)
```

---

## 💻 Local Setup & Development

### Prerequisites

*   Docker Desktop installed on your system.

### Running the System

1.  Clone or copy the directory `D:\inventory-order-system` to your machine.
2.  Open your terminal in the project root directory.
3.  Create your local environment file by copying `.env.example`:
    ```bash
    cp .env.example .env
    ```
4.  Build and spin up the multi-container stack:
    ```bash
    docker-compose up --build
    ```
5.  Once the build completes and the services are marked healthy, you can access:
    *   **Frontend Dashboard:** [http://localhost](http://localhost) (Port 80)
    *   **Backend Health Check:** [http://localhost:8000](http://localhost:8000)
    *   **API Interactive Documentation (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
    *   **Database Host:** `localhost:5432`

---

## 🐳 Docker Hub Packaging

To build and push your backend image to your Docker Hub registry:

1.  Log in to your Docker Hub account:
    ```bash
    docker login
    ```
2.  Build the backend image:
    ```bash
    docker build -t <your-dockerhub-username>/flowstock-backend:latest ./backend
    ```
3.  Push the image:
    ```bash
    docker push <your-dockerhub-username>/flowstock-backend:latest
    ```

---

## 🌐 Production Deployment Guide

### 1. Database (PostgreSQL)
*   **Recommended Platforms:** Railway, Render (PostgreSQL Service), or Supabase.
*   **Setup:** Create a new PostgreSQL instance, copy the generated connection string (`postgresql://...`), and save it.

### 2. Backend (FastAPI)
*   **Recommended Platforms:** Render (Web Service) or Railway.
*   **Setup:**
    *   Connect your GitHub repository.
    *   Select **Docker** as the deployment runtime (Render will automatically detect the `Dockerfile` inside the root or you can specify `./backend/Dockerfile` as the Dockerfile Path).
    *   Define the following Environment Variables in the service settings:
        *   `DATABASE_URL`: Set to your production PostgreSQL connection string.
        *   `CORS_ORIGINS`: Set to your production frontend domain (e.g., `https://my-flowstock.vercel.app`).

### 3. Frontend (React)
*   **Recommended Platforms:** Vercel or Netlify.
*   **Setup:**
    *   Connect your GitHub repository.
    *   Configure the project settings:
        *   **Root Directory:** `frontend`
        *   **Build Command:** `npm run build`
        *   **Output Directory:** `dist`
    *   Define the Environment Variable:
        *   `VITE_API_URL`: Set to your deployed Backend service URL (e.g., `https://flowstock-backend.onrender.com`).

---
*Developed with love by FlowStock team.*
