# GrailKits

GrailKits is a high-concurrency e-commerce backend for limited football kits.
The project is split into an API Gateway plus three domain services, with PostgreSQL
for the catalog and ordering core and MongoDB for product reviews.

## Architecture

```
Client
  |
  v
+------------------+
|     Gateway       |  :3000  (reverse proxy / routing)
+------------------+
   |        |       |
   v        v       v
Catalog  Review   Order
Service  Service  Service
:3001    :3002    :3003
   |        |       |
   v        |       v
PostgreSQL  |    PostgreSQL
(pg+Knex,   |    (Sequelize)
 Prisma)    v
         MongoDB
         (Mongoose)
```

Services:

- `gateway` — public entry point and reverse proxy; routes `/api/v1/catalog/*`, `/api/v1/orders/*`, `/api/v1/reviews/*` to the correct downstream service
- `catalog-service` — categories, products, and product variants; also exposes review analytics via a `$lookup` aggregation to MongoDB
- `order-service` — cart management, checkout transaction, and order lifecycle (create, cancel)
- `review-service` — product reviews with moderation queue

Storage:

- `postgres` — relational storage for catalog (categories, products, variants) and orders
- `mongo` — document storage for reviews

## Tech Stack

- Node.js and Express
- PostgreSQL 16
- MongoDB 7
- `pg` — raw SQL driver for catalog writes and schema setup
- Knex.js — query builder for product catalog reads
- Prisma — ORM used for catalog schema introspection and `migrate deploy` at container startup
- Sequelize v6 — ORM for order and cart models (transactions with pessimistic locking)
- Mongoose — ODM for reviews
- Docker and Docker Compose

## Data Flow

### Browsing and Catalog

```
GET /api/v1/catalog/products
  -> Gateway
  -> catalog-service
  -> Knex query on PostgreSQL (products + variants JOIN)
  -> response
```

Full product details (including MongoDB review summary) follow a hybrid path:

```
GET /api/v1/catalog/products/:id
  -> Gateway
  -> catalog-service
  -> Knex: fetch product row from PostgreSQL
  -> Prisma $queryRaw: fetch variant count
  -> MongoDB aggregation ($lookup + $unwind + $sort): fetch latest reviews
  -> merged response
```

### Review Analytics (PostgreSQL + MongoDB hybrid)

```
GET /api/v1/reviews/analytics/avg-rating?productId=:id
  -> review-service
  -> MongoDB $group aggregation: avg rating, review count for product
  -> response { productId, avgRating, reviewCount }
```

The analytics endpoint is backed exclusively by MongoDB — no cross-database join is needed because MongoDB's aggregation pipeline handles grouping natively.

### Cart and Checkout

```
POST /api/v1/cart/lines   (add item to cart)
  -> order-service
  -> Sequelize transaction (READ COMMITTED):
       1. SELECT variant FROM variants FOR UPDATE  (pessimistic lock)
       2. Check stock >= requested quantity
       3. Upsert cart line
  -> response: current cart

POST /api/v1/checkout   (convert cart to order)
  -> order-service
  -> Sequelize transaction:
       1. For each cart line:
          a. SELECT variant FOR UPDATE
          b. Assert stock >= line quantity   (409 on race condition)
          c. UPDATE variants SET stock = stock - quantity
       2. INSERT order + order_items
       3. UPDATE cart SET status = CHECKED_OUT
  -> response: new order with PENDING status
```

Pessimistic locking (`FOR UPDATE`) prevents oversell under concurrent requests. All steps are in a single Sequelize-managed transaction; a failure at any step rolls back the entire operation.

### Order Cancellation (Transactional Compensation)

```
POST /api/v1/orders/:id/cancel
  -> order-service
  -> Sequelize transaction:
       1. Assert order exists and belongs to user
       2. Assert status in [PENDING, PAID]
       3. UPDATE orders SET status = CANCELLED
       4. For each order item with a variantId:
          UPDATE variants SET stock = stock + quantity
  -> response: updated order with CANCELLED status
```

Stock is restored atomically with the status update. If stock restoration fails the transaction rolls back and the order remains in its original status.

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

| Service          | URL                        |
|------------------|----------------------------|
| Gateway          | http://localhost:3000      |
| Catalog service  | http://localhost:3001      |
| Review service   | http://localhost:3002      |
| Order service    | http://localhost:3003      |
| PostgreSQL       | localhost:5432             |
| MongoDB          | localhost:27017            |

## Health Checks

- `GET /health` on all four Node services

## Public API Routes

All routes are accessible through the gateway at `http://localhost:3000`. The full
specification is in `docs/openapi.yaml`.

**Catalog**

| Method | Path                                         | Description                   |
|--------|----------------------------------------------|-------------------------------|
| GET    | /api/v1/catalog/products                     | List products (filterable)    |
| GET    | /api/v1/catalog/products/:id                 | Product detail + reviews      |
| POST   | /api/v1/catalog/products                     | Create product                |
| GET    | /api/v1/catalog/categories                   | List categories               |
| POST   | /api/v1/catalog/categories                   | Create category               |
| GET    | /api/v1/catalog/products/count               | Count products                |

**Reviews**

| Method | Path                                         | Description                   |
|--------|----------------------------------------------|-------------------------------|
| POST   | /api/v1/reviews                              | Submit a review               |
| GET    | /api/v1/reviews/product/:productId           | Reviews for a product         |
| GET    | /api/v1/reviews/approved                     | All approved reviews          |
| GET    | /api/v1/reviews/analytics/avg-rating         | Avg rating per product        |
| GET    | /api/v1/reviews/moderation                   | Reviews pending moderation    |
| PATCH  | /api/v1/reviews/:id/moderate                 | Approve or reject a review    |

**Orders and Cart**

| Method | Path                                         | Description                   |
|--------|----------------------------------------------|-------------------------------|
| POST   | /api/v1/cart/lines                           | Add item to cart              |
| GET    | /api/v1/cart                                 | Get current cart              |
| POST   | /api/v1/checkout                             | Checkout cart                 |
| POST   | /api/v1/orders                               | Create order directly         |
| GET    | /api/v1/orders                               | List orders for a user        |
| GET    | /api/v1/orders/:id                           | Get order by ID               |
| POST   | /api/v1/orders/:id/cancel                    | Cancel order                  |

## Environment Variables

The Docker Compose setup injects the required values automatically. See `.env.example`
for all supported variables. The most important ones are:

| Variable              | Used by                     |
|-----------------------|-----------------------------|
| `PORT`                | all services                |
| `DATABASE_URL`        | catalog-service (Prisma)    |
| `DB_HOST / DB_PORT`   | catalog-service (pg, Knex)  |
| `DB_USER / DB_PASSWORD / DB_NAME` | catalog-service  |
| `ORDER_DB_URL`        | order-service (Sequelize)   |
| `MONGODB_URI`         | review-service (Mongoose)   |
| `CATALOG_SERVICE_URL` | gateway                     |
| `REVIEW_SERVICE_URL`  | gateway                     |
| `ORDER_SERVICE_URL`   | gateway                     |

## Data Ownership

| Store      | Driver         | Data                                   |
|------------|----------------|----------------------------------------|
| PostgreSQL | pg + Knex      | categories, products, variants (writes)|
| PostgreSQL | Prisma         | schema migration at startup            |
| PostgreSQL | Sequelize      | carts, cart lines, orders, order items |
| MongoDB    | Mongoose       | reviews (pending, approved, rejected)  |

## Error Format

All services return a unified error envelope:

```json
{
  "error": "Human-readable message",
  "code": "NOT_FOUND",
  "details": null
}
```

Error codes: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`,
`UNPROCESSABLE_ENTITY`, `INTERNAL_ERROR`.

## Security Threats and Mitigations

### 1. Oversell / Race Condition (Inventory Integrity)

**Threat**: Two concurrent checkout requests for the same low-stock variant could both
read a sufficient stock level before either decrements it, resulting in negative stock
and fulfilled orders that cannot be shipped.

**Mitigation**: The checkout flow uses PostgreSQL pessimistic locking (`SELECT … FOR UPDATE`)
inside a Sequelize-managed transaction. The first request acquires a row-level lock on the
variant; the second blocks until the first commits. After the first commit the second
re-reads the updated stock and returns HTTP 409 if stock is now insufficient.

---

### 2. Horizontal Enumeration of Orders (Broken Object Level Authorization)

**Threat**: An authenticated user could request another user's order by guessing its UUID,
leaking purchase history and delivery details.

**Mitigation**: Every order endpoint reads the `X-User-Id` header (injected by the gateway
after authentication) and compares it to `order.userId`. Mismatches return HTTP 403 before
any data is returned. The check is enforced at the service layer, not only the controller,
so it cannot be bypassed by internal callers that omit the header.

---

### 3. Missing Authentication on Sensitive Mutations

**Threat**: Without verifying caller identity, anyone who knows the internal service URL
can create products, cancel orders, or moderate reviews.

**Mitigation**: The gateway is the sole public entry point. Internal service ports are not
exposed in the Docker Compose `ports` mapping for production profiles. Sensitive mutations
(create product, moderate review, cancel order) require the `X-User-Id` header; requests
without it receive HTTP 400 before business logic runs.

> **Future hardening**: replace header-based identity with JWT verification in the gateway
> so that the `X-User-Id` value is cryptographically signed rather than caller-supplied.

---

### 4. SQL Injection

**Threat**: Dynamic query construction with unsanitised user input could allow an attacker
to exfiltrate the entire database or drop tables.

**Mitigation**: All database access goes through parameterised queries — Knex `.where()`,
Sequelize model methods, Prisma `$queryRaw` with tagged template literals, and `pg`
prepared statements. Raw SQL strings are never concatenated with user input. Prisma's
`$queryRaw` uses the `sql` template tag which automatically escapes interpolated values.

---

### 5. NoSQL Injection (MongoDB)

**Threat**: If MongoDB query operators (`$where`, `$gt`, etc.) are passed as request body
fields, an attacker could bypass filters or access documents belonging to other users.

**Mitigation**: Mongoose schema validation rejects fields not declared in the schema.
Query fields sourced from request parameters (e.g., `productId`) are treated as plain
strings; they are passed as `{ productId: req.params.productId }` — object operator
injection requires the caller to supply an object, which Express parses as a nested
body field only when `extended: true` is set on `urlencoded`. GrailKits uses `express.json()`
only, so operator-injection via URL parameters is not possible.

> **Future hardening**: add explicit type validation (e.g. `mongoose-validator` or `zod`)
> on all inbound request bodies.

---

### 6. Denial of Service via Large Payloads

**Threat**: An attacker can POST arbitrarily large JSON bodies to exhaust memory and crash
a Node.js process.

**Mitigation**: Express's built-in `json()` middleware accepts a `limit` option. All
services should configure `express.json({ limit: '100kb' })`. This is documented here
as a recommended hardening step; the default Express limit is 100 kB.

---

### 7. Sensitive Data Exposure in Logs

**Threat**: Logging full request/response objects can leak user IDs, order contents, or
pricing data into log aggregation systems accessible to a wider audience.

**Mitigation**: Console logging in controllers is scoped to error paths only and logs the
error message rather than the full request body. User IDs are logged at the INFO level
only for debugging builds (`NODE_ENV !== 'production'`).

> **Future hardening**: structured logging (e.g. `pino`) with a sensitive-field redaction
> list and log-level control via environment variable.

---

### 8. Dependency Vulnerabilities

**Threat**: Third-party npm packages can introduce known CVEs that attackers exploit after
public disclosure.

**Mitigation**: `npm ci` is used in the Dockerfile instead of `npm install` to guarantee
exact lock-file versions. Run `npm audit` in CI to catch newly disclosed vulnerabilities
before deployment.

## Example Requests

List products:

```bash
curl http://localhost:3000/api/v1/catalog/products
```

Add item to cart:

```bash
curl -X POST http://localhost:3000/api/v1/cart/lines \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-123" \
  -d '{ "variantId": "variant-1", "quantity": 1 }'
```

Checkout:

```bash
curl -X POST http://localhost:3000/api/v1/checkout \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-123"
```

Cancel an order:

```bash
curl -X POST http://localhost:3000/api/v1/orders/ORDER_ID/cancel \
  -H "X-User-Id: user-123"
```

Create a review:

```bash
curl -X POST http://localhost:3000/api/v1/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-1",
    "userId": "user-123",
    "rating": 5,
    "title": "Great shirt",
    "body": "Arrived quickly and fits perfectly."
  }'
```

## Notes

- The project is designed for Docker-first startup.
- The full API specification is in `docs/openapi.yaml`.
- Prices are stored in the smallest currency unit (e.g. grosz / pence) to avoid floating-point rounding errors.
- Catalog-service runs `npx prisma migrate deploy` automatically at container startup before the Express server binds.
