# GrailKits — Docker Checklist

## Architektura

```
                         Client
                           |
                    [80] Nginx :80
                    reverse-proxy
                    (external-net)
                           |
                    [3000] Gateway
                    (external-net + internal-net)
                    Redis rate-limiter
                      /    |    \
                     /     |     \
              Catalog   Review   Order
              :3001     :3002    :3003
             /    \    /    \      |
           PG    Mongo Mongo  PG   PG
```

| Serwis | Port | Sieć | Opis |
|--------|------|------|------|
| `reverse-proxy` | 80 | external-net | Nginx — jedyny punkt wejścia z zewnątrz |
| `gateway` | 3000 | external-net + internal-net | Reverse proxy Node.js, rate limiting via Redis |
| `catalog-service` | 3001 | internal-net | Produkty, warianty, kategorie (PG + MongoDB) |
| `review-service` | 3002 | internal-net | Recenzje, moderacja, analityka (MongoDB + PG) |
| `order-service` | 3003 | internal-net | Koszyk, zamówienia, płatności (PG Sequelize + Prisma) |
| `redis` | — | internal-net | Rate limiting store (bez portu na hosta) |
| `postgres` | — | internal-net | Baza relacyjna (bez portu na hosta) |
| `mongo` | — | internal-net | Baza dokumentowa (bez portu na hosta) |

---

## Uruchomienie od zera

```bash
# 1. Sklonuj repo i wejdź do katalogu
git clone <repo-url>
cd grailkits

# 2. Utwórz plik środowiskowy
cp .env.example .env
# Ustaw swoje hasła w .env (zamień change_me_* na własne wartości)

# 3. Uruchom wszystkie kontenery
docker compose up -d --build

# 4. Sprawdź status (wszystkie powinny być healthy)
docker compose ps
```

---

## Komendy weryfikacyjne

### 1. Healthchecki wszystkich serwisów
```bash
curl -s http://localhost:80/api/health | jq .
# Oczekiwany wynik: { "status": "API Gateway is operational" }

curl -s http://localhost:80/api/v1/products | jq '. | length'
# Oczekiwany wynik: 5  (liczba seedowanych produktów)
```

### 2. Dodanie rekordu (POST)
```bash
curl -s -X POST http://localhost:80/api/v1/cart/lines \
  -H "Content-Type: application/json" \
  -H "x-user-id: checklist-user" \
  -d '{"variantId":"b0000000-0000-0000-0000-000000000001","quantity":1}' | jq .status
# Oczekiwany wynik: "OPEN"
```

### 3. Odczyt listy danych (GET)
```bash
curl -s http://localhost:80/api/v1/products | jq '[.[].name]'
# Oczekiwany wynik:
# ["Arsenal 1989 Home","Barcelona 2006 Away","France 1998 World Cup Home",
#  "Manchester City 2023 Third","Real Madrid 1998 Home"]
```

### 4. Trwałość danych — restart środowiska
```bash
# Krok 1: dodaj rekord
curl -s -X POST http://localhost:80/api/v1/cart/lines \
  -H "Content-Type: application/json" \
  -H "x-user-id: persist-test" \
  -d '{"variantId":"b0000000-0000-0000-0000-000000000001","quantity":1}' | jq .id

# Krok 2: zrestartuj środowisko (bez -v żeby zachować dane)
docker compose down && docker compose up -d

# Krok 3: odczytaj ponownie — koszyk nadal istnieje
curl -s http://localhost:80/api/v1/cart \
  -H "x-user-id: persist-test" | jq .status
# Oczekiwany wynik: "OPEN"
```

### 5. Redis — dowód działania rate limitingu
```bash
# Wyślij kilka szybkich requestów i sprawdź nagłówki
for i in {1..5}; do
  curl -s -o /dev/null -w "Status: %{http_code} | RateLimit-Remaining: %header{x-ratelimit-remaining}\n" \
    http://localhost:80/api/v1/products
done
# Oczekiwany wynik: malejąca wartość X-RateLimit-Remaining w nagłówkach
```

### 6. Izolacja sieci — baza niedostępna z zewnątrz
```bash
# Postgres NIE powinien odpowiadać z hosta
curl -s --connect-timeout 2 http://localhost:5432 || echo "OK — baza niedostępna z zewnątrz"
# Oczekiwany wynik: "OK — baza niedostępna z zewnątrz"
```

---

## Weryfikacja architektury Docker

```bash
# Sprawdź sieci i przypisanie kontenerów
docker compose config | grep -A5 "networks:"
docker network inspect grailkits_external-net
docker network inspect grailkits_internal-net

# Sprawdź wolumeny
docker volume ls | grep grailkits

# Sprawdź że serwisy nie działają jako root
docker compose exec catalog-service whoami   # → node
docker compose exec gateway whoami           # → app
docker compose exec review-service whoami    # → app
docker compose exec order-service whoami     # → app
docker compose exec reverse-proxy whoami     # → nginx

# Sprawdź limity zasobów
docker compose config | grep -A4 "resources:"

# Logi z rotacją
docker inspect grailkits_postgres | grep -A5 "LogConfig"
```

---

## Wymagania dodatkowe (wykonane)

| Wymaganie | Stan | Gdzie |
|-----------|------|-------|
| Limity CPU/RAM | ✅ | `deploy.resources.limits` w każdym serwisie |
| Rotacja logów | ✅ | `logging.driver: json-file, max-size: 10m, max-file: 3` |
| Graceful shutdown / SIGTERM | ✅ | `stop_grace_period: 10s` + `process.on('SIGINT')` w MongoDB |
| Tagowanie obrazów | ✅ | `grailkits/<service>:1.0.0` w docker-compose.yml |

---

## Ports summary

| Usługa | Host | Uwagi |
|--------|------|-------|
| Nginx (reverse-proxy) | `localhost:80` | Jedyny wystawiony port |
| PostgreSQL | — | Tylko internal-net |
| MongoDB | — | Tylko internal-net |
| Redis | — | Tylko internal-net |
