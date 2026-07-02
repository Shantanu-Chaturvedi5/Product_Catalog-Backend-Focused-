# 🚀 Product Catalog Backend

A production-ready backend system that demonstrates **cursor-based pagination** for browsing **200,000+ products** efficiently while guaranteeing **no duplicate or missing records**, even when products are inserted or updated during browsing.

This project is built to showcase senior-level backend engineering concepts including scalable pagination, PostgreSQL indexing, asynchronous APIs, and clean architecture.

---

## 🌐 Live Demo

**Link:** https://product-catalog-backend-focused.vercel.app/


---

## ✨ Features

- Cursor-based pagination
- Browse 200,000+ products
- Category filtering
- Price filtering
- Product search
- Stable ordering using `(updated_at, id)`
- No duplicate records across pages
- No skipped products during concurrent updates
- Fast PostgreSQL indexed queries
- Async FastAPI backend
- Performance benchmark endpoints
- Health monitoring endpoint
- Database seed script

---

## 🛠 Tech Stack

### Backend

- FastAPI
- SQLAlchemy 2.0 (Async)
- PostgreSQL
- Alembic
- AsyncPG
- Faker

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Deployment

- Vercel (Frontend)
- Railway (Backend)
- Neon PostgreSQL (Database)

---

## 📂 Project Structure

```
product-catalog-backend
│
├── alembic/
├── scripts/
├── src/
│   ├── api/
│   ├── database/
│   ├── models/
│   ├── services/
│   ├── schemas/
│   └── main.py
│
├── tests/
├── Dockerfile
├── requirements.txt
└── README.md
```

---

## ⚡ Installation

Clone the repository

```bash
git clone https://github.com/Shantanu-Chaturvedi5/Product_Catalog-Backend-Focused-.git
```

Move into the project

```bash
cd Product_Catalog-Backend-Focused-
```

Create a virtual environment

```bash
python -m venv .venv
```

Activate it

Windows

```bash
.venv\Scripts\activate
```

Linux / macOS

```bash
source .venv/bin/activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

---

## ⚙️ Environment Variables

Create a `.env` file.

```env
DATABASE_URL=your_postgresql_database_url
```

---

## 🗄 Database Migration

Run migrations

```bash
python -m alembic upgrade head
```

---

## 🌱 Seed Database

Generate 200,000 products

```bash
python -m scripts.seed_products
```

---

## ▶️ Run the Server

```bash
uvicorn src.main:app --reload
```

Server runs on

```
http://localhost:8000
```

---

## 📌 API Endpoints

### Health

```
GET /health
```

### Products

```
GET /products
```

Supports

- cursor
- limit
- category
- min_price
- max_price
- search

Example

```
GET /products?limit=20
```

---

### Metrics

```
GET /metrics
```

Returns API performance statistics.

---

### Benchmarks

```
GET /benchmarks
```

Compares cursor pagination with offset pagination.

---

### Seed Information

```
GET /seed-info
```

Returns

- Total generated records
- Generation duration
- Category distribution

---

## 🚀 Cursor Pagination

Instead of using OFFSET/LIMIT, this project uses **cursor-based pagination**.

Benefits include:

- O(1) page navigation
- Stable pagination
- No duplicates
- No skipped records
- Better scalability
- Efficient indexed queries

Cursor ordering is based on

```
(updated_at DESC, id DESC)
```

---

## 📈 Database Indexes

```
(updated_at, id)
category
price
```

These indexes optimize pagination and filtering performance.

---

## 🧪 Performance

Dataset Size

- 200,000+ products

Supports

- Cursor pagination
- Category filtering
- Price filtering
- Search

Optimized for low-latency database queries.

---

## 📸 Screenshots

Add screenshots here.

Example

```
screenshots/home.png
screenshots/products.png
screenshots/filters.png
```

---

## 🔮 Future Improvements

- Redis caching
- Authentication
- Rate limiting
- Full-text search
- Docker Compose deployment
- CI/CD with GitHub Actions
- API documentation improvements

---

## 👨‍💻 Author

**Shantanu Chaturvedi**

GitHub

https://github.com/Shantanu-Chaturvedi5

LinkedIn

https://www.linkedin.com/in/shantanu-chaturvedi-874a87341/

---

## 📄 License

This project is licensed under the MIT License.
