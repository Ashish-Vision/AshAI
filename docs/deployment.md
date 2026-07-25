# AshAI Deployment Guide

## Prerequisites
- Java 21 JDK
- Maven 3.9+
- PostgreSQL 16+ or Docker Compose

## Local Manual Run
1. Start PostgreSQL server on localhost:5432 with database `ashai_db`.
2. Launch Spring Boot API:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
3. Serve frontend:
   Open `frontend/index.html` or serve via local HTTP server on port 5500:
   ```bash
   npx serve frontend -p 5500
   ```

## Docker Container Deployment
Set `JWT_SECRET`, database, Gemini, OAuth, SMTP, and public `FRONTEND_URL`
environment variables in the deployment platform first. Never copy
`backend/.env` into an image or commit it.

Use Docker Compose from the project root:
```bash
docker-compose -f docker/docker-compose.yml up --build -d
```
- Backend API will be reachable at `http://localhost:8080`
- Web Dashboard will be reachable at `http://localhost:5500`

For production, serve the frontend over HTTPS. The included Nginx configuration
proxies backend routes on the same public origin. Register these callbacks:

- `https://your-domain.example/login/oauth2/code/google`
- `https://your-domain.example/login/oauth2/code/github`
