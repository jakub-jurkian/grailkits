# GrailKits

E-commerce backend for limited football kits. API Gateway + three domain microservices, PostgreSQL for catalog and orders, MongoDB for product details and reviews.

## Architecture

```
           Client
             |
             v
         Gateway :3000
  |          |          |
  v          v          v
Catalog    Review     Order
Service    Service    Service
:3001      :3002      :3003
  |          |          |
  v          v          v
PostgreSQL  MongoDB  PostgreSQL
(pg/Knex/  (Mongoose) (Sequelize)
 Prisma)
```

| Service | Responsibility |
|---------|---------------|
| `gateway` | Public entry point and reverse proxy; routes `/api/v1/products/*`, `/api/v1/reviews/*`, `/api/v1/orders/*` to downstream services |
| `catalog-service` | Categories, products, and variants in PostgreSQL; product details (descriptions, specs, gallery) in MongoDB |
| `review-service` | Review submission, moderation queue, analytics aggregation; writes `avg_rating` back to PostgreSQL on approval |
| `order-service` | Cart management, checkout with pessimistic locking, order lifecycle (create, cancel with stock compensation) |

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Runtime    | Node.js + Express                               |
| PostgreSQL | `pg` (raw pool + error mapping), Knex (query builder + migrations), Prisma (`findUnique` with `include`, `create`, `delete`, `$queryRaw`), Sequelize v6 (ORM + managed transactions + pessimistic locking) |
| MongoDB    | MongoDB native driver (`product_details` in catalog-service), Mongoose (`reviews` in review-service; read-only populate of `product_details`) |
| Infra      | Docker, Docker Compose, PostgreSQL 16, MongoDB 7 |

## API Routes

Full specification: [`docs/openapi.yaml`](docs/openapi.yaml). All routes are served through the gateway at `http://localhost:3000`.

## Key Design Decisions

- **Pessimistic locking** — checkout uses `SELECT ... FOR UPDATE` to prevent oversell under concurrent requests.
- **Hybrid write-back** — approving a review triggers a MongoDB `$group` aggregation and writes `avg_rating` + `review_count` back to PostgreSQL. If the PG write fails, MongoDB is reverted to `PENDING` (compensation).
- **Order snapshot** — `order_items` stores `skuSnapshot` and `unitPrice` at checkout time so order history is immutable even if catalog changes.
- **Knex as schema authority** — all DDL for the catalog goes through Knex migrations. Prisma is baselined (its own migration history is marked as applied at container startup) and used at runtime for typed CRUD on products (`findUnique` with `include`, `create`, `delete`) and for one tagged-template `$queryRaw`.
- **Prices in grosz** — stored as integers to avoid floating-point rounding errors.

## Data Flow (PostgreSQL / MongoDB)

**PostgreSQL** stores the relational core — categories, products, variants, carts, and orders. Knex manages all DDL migrations for the catalog; Sequelize handles cart and order transactions with pessimistic locking (`SELECT ... FOR UPDATE`); Prisma serves typed CRUD reads/writes for products (with `include` eager loading) and a tagged-template `$queryRaw` for counts.

**MongoDB** stores documents that benefit from flexible schemas — `product_details` (long description, specs map, image gallery) and `reviews` (rating, body, moderation history). The `product_details` collection is owned and written by `catalog-service` through the **MongoDB native driver** (singleton `MongoClient` with `SIGINT` close, indexes ensured on connect); `review-service` uses **Mongoose** to manage `reviews` (custom validators, pre-save hook, statics, virtual populate of `product_details`).

**Hybrid writes** — when a review is approved, review-service runs a MongoDB `$group` aggregation to compute `avg_rating` and `review_count`, then writes the result back to the `products` table in PostgreSQL. If the PostgreSQL write fails, MongoDB is reverted to `PENDING` (transactional compensation).

## Environment Variables

| Variable                          | Used by                                                      |
|-----------------------------------|--------------------------------------------------------------|
| `PORT`                            | all services                                                 |
| `DATABASE_URL`                    | catalog-service (Prisma), order-service (Sequelize), review-service (PG write-back) |
| `DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME` | catalog-service (pg, Knex)         |
| `MONGODB_URI`                     | catalog-service (Mongoose), review-service (Mongoose)        |
| `CATALOG_SERVICE_URL`             | gateway                                                      |
| `REVIEW_SERVICE_URL`              | gateway                                                      |
| `ORDER_SERVICE_URL`               | gateway                                                      |

## Running

```bash
docker compose up -d --build
docker compose ps          # check health status
docker compose logs -f     # stream all logs
```

## Ports

| Service         | URL                   |
|-----------------|-----------------------|
| Gateway         | http://localhost:3000 |
| Catalog service | http://localhost:3001 |
| Review service  | http://localhost:3002 |
| Order service   | http://localhost:3003 |
| PostgreSQL      | localhost:5432        |
| MongoDB         | localhost:27017       |

## Security

| Threat | Mitigation |
|--------|-----------|
| **Oversell / race condition** | `SELECT ... FOR UPDATE` (pessimistic lock) on variant row during checkout; concurrent request blocks until first commits, then re-checks stock → 409 if insufficient |
| **Broken object-level authorization** | Every order endpoint compares `X-User-Id` header to `order.userId` at service layer; mismatch → 403 before any data is returned |
| **SQL injection** | All queries use parameterised statements — Knex `.where()`, Sequelize model methods, Prisma `$queryRaw` tagged template, `pg` prepared statements; no string concatenation with user input |
| **NoSQL injection** | Mongoose schema validation rejects undeclared fields; `productId` from params is passed as a plain string, not an object |
| **XSS in review body** | Mongoose validator blocks any value containing `<`, `>`, or `<script` before save |
| **Stack trace leakage** | Controllers catch all errors and return `{ error, code }` — raw error objects and stack traces are never forwarded to the client |

## Error Format

```json
{ "error": "message", "code": "NOT_FOUND", "details": null }
```

Codes: `BAD_REQUEST`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`.
