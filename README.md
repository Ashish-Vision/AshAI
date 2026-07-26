# AshAI — Intelligent AI Workspace Application

AshAI is a full-stack AI workspace platform featuring an interactive chat interface, Spring Boot REST backend, JWT authentication, user profile management, dark/light theme switching, and AI model integration.

![AshAI Banner](screenshots/dashboard.png)

## Features
- 🤖 **AI Assistant Chat**: Interactive chat assistant connected to Gemini API with fallback capabilities.
- 🔐 **Secure Authentication**: JWT-based stateless authentication with password hashing (BCrypt).
- ✉️ **Email Verification & Password Reset**: Token-based workflows for email verification and account password recovery.
- 👤 **User Profile & Preferences**: Profile management, customizable bios, dark/light theme switching, and settings.
- 🐳 **Docker Support**: Containerized setup via Docker Compose.

## Project Structure
```
AshAI/
├── backend/          # Spring Boot 3.5 (Java 21) REST API
├── frontend/         # HTML5, CSS Variables, ES Modules, Markdown engine
├── docker/           # Dockerfile and docker-compose configurations
└── docs/             # Technical architecture & API documentation
```

## Quick Start
```bash
# Clone the repository
git clone https://github.com/Ashish-Vision/AshAI.git
cd AshAI

# Run with Docker Compose
docker-compose -f docker/docker-compose.yml up --build
```
Access the application at `http://localhost:5500`.

## Personal Local Mode

AshAI defaults to a private, single-owner workspace. Set these variables before
starting it:

```bash
export PERSONAL_MODE_ENABLED="true"
export PERSONAL_EMAIL="your-private-email@gmail.com"
export FRONTEND_URL="http://localhost:5500"
export JWT_SECRET="a-private-base64-encoded-key-of-at-least-32-bytes"
export GEMINI_API_KEY="your-gemini-api-key"
export MAIL_ENABLED="false"
```

Start the complete local stack with:

```bash
docker compose -f docker/docker-compose.yml up --build
```

Open `http://localhost:5500`, create the account using exactly `PERSONAL_EMAIL`,
and then sign in. The owner account is activated immediately, so email
verification and a transactional email provider are not required. Registration,
password login, and OAuth attempts using any other email are rejected.

Google and GitHub login are optional. To use either locally, configure its client
ID and secret and register these callback URLs:

- Google: `http://localhost:8080/login/oauth2/code/google`
- GitHub: `http://localhost:8080/login/oauth2/code/github`

The OAuth account email must match `PERSONAL_EMAIL`. Secrets belong only in
environment variables and must never be committed.

## Private Desktop AI with Ollama

AshAI runs Ollama, PostgreSQL, the Spring Boot API, and the interface as local
Docker services. When Ollama is available, prompts and responses remain on this
computer.

Download the selected models once:

```bash
docker compose -f docker/docker-compose.yml up -d --build
docker exec ashai-ollama ollama pull gemma3:4b
docker exec ashai-ollama ollama pull qwen2.5-coder:7b
```

Open **AshAI** from the Linux application menu afterward. Gemma 3 handles
standard, analytical, and image requests. Qwen 2.5 Coder handles code requests.
Both models persist in the `ollama_data` Docker volume between restarts.
