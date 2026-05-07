# event-microservices



## Запуск

```bash
# Клонировать репозиторий
git clone <repo>

# Заполнить .env
cp .env.example .env

# Запустить
docker compose -f infra/docker-compose.yml up --build

# Отправить событие
curl -X POST http://localhost:3000/events \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "USER_REGISTERED",
    "payload": {
      "userId": "00000000-0000-4000-8000-000000000000",
      "email": "you@example.com",
      "registeredAt": "2026-05-04T12:00:00.000Z"
    }
  }'

# Postman (JSON)
{
    "type": "USER_REGISTERED",
    "payload": {
      "userId": "00000000-0000-4000-8000-000000000000",
      "email": "you3@example.com",
      "registeredAt": "2026-05-04T12:00:00.000Z"
    }
}
```

