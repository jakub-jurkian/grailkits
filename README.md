# GrailKits

GrailKits is a high-concurrency e-commerce backend for limited football kits.
The project is split into an API Gateway plus three domain services, with PostgreSQL
for the catalog and ordering core and MongoDB for product reviews.

## Architecture

- `gateway` - public entry point and reverse proxy
- `catalog-service` - categories, products, and product variants
- `order-service` - order creation and checkout transaction flow
- `review-service` - product reviews
- `postgres` - relational storage for catalog and orders
- `mongo` - document storage for reviews

## Tech Stack

- Node.js and Express
- PostgreSQL 16
- MongoDB 7
- pg
- Knex.js
- Prisma
- Sequelize v6
- Mongoose
- Docker and Docker Compose

## Running The Project

Start the full stack with Docker Compose:

```bash
docker compose up -d --build
```

Useful follow-up commands:

```bash
docker compose ps
docker compose logs -f gateway
docker compose logs -f catalog-service
docker compose logs -f order-service
docker compose logs -f review-service
```

## Ports

- Gateway: `http://localhost:3000`
- Catalog service: `http://localhost:3001`
- Review service: `http://localhost:3002`
- Order service: `http://localhost:3003`
- PostgreSQL: `localhost:5432`
- MongoDB: `localhost:27017`

## Health Checks

- `GET /health` on all four Node services

## Public API Routes

Gateway routes:

- `GET /api/v1/catalog/products`
- `GET /api/v1/catalog/products/:id`
- `POST /api/v1/catalog/products`
- `GET /api/v1/catalog/categories`
- `POST /api/v1/orders`
- `POST /api/v1/reviews`
- `GET /api/v1/reviews/product/:productId`

Direct service routes:

- Catalog service: `GET /api/v1/categories`, `GET /api/v1/products`, `GET /api/v1/products/:id`, `POST /api/v1/products`
- Review service: `POST /api/v1/reviews`, `GET /api/v1/reviews/product/:productId`
- Order service: `POST /api/v1/orders`

## Environment Variables

The Docker Compose setup injects the required values automatically. The most important
variables are:

- `PORT`
- `DATABASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `MONGODB_URI`
- `CATALOG_SERVICE_URL`
- `REVIEW_SERVICE_URL`
- `ORDER_SERVICE_URL`

## Data Ownership

- PostgreSQL via `pg` and Knex stores categories, products, and variants.
- Prisma reads the product catalog details and relations.
- Sequelize stores orders and order items.
- Mongoose stores reviews.

## Example Requests

List products through the gateway:

```bash
curl http://localhost:3000/api/v1/catalog/products
```

Create an order:

```bash
curl -X POST http://localhost:3000/api/v1/orders \
	-H "Content-Type: application/json" \
	-d '{
		"userId": "user-123",
		"items": [
			{ "productId": "product-1", "quantity": 1, "unitPrice": 89900 }
		]
	}'
```

Create a review:

```bash
curl -X POST http://localhost:3000/api/v1/reviews \
	-H "Content-Type: application/json" \
	-d '{
		"productId": "product-1",
		"userId": "user-123",
		"rating": 5,
		"comment": "Great shirt"
	}'
```

## Notes

- The project is designed for Docker-first startup.
- The public API is documented in `docs/openapi.yaml`.
- Prices are handled in the smallest currency unit to avoid floating point issues.
