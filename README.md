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

## Google and GitHub Login

Set these environment variables before starting the backend:

```bash
export GOOGLE_CLIENT_ID="your-google-client-id"
export GOOGLE_CLIENT_SECRET="your-google-client-secret"
export GITHUB_CLIENT_ID="your-github-client-id"
export GITHUB_CLIENT_SECRET="your-github-client-secret"
export FRONTEND_URL="http://localhost:5500"
```

Register these authorization callback URLs with the providers:

- Google: `http://localhost:8080/login/oauth2/code/google`
- GitHub: `http://localhost:8080/login/oauth2/code/github`

For GitHub, set the homepage URL to `http://localhost:5500`. OAuth secrets must
remain in environment variables and must never be committed.
