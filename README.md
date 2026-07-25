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
export JWT_SECRET="a-private-base64-encoded-key-of-at-least-32-bytes"
export MAIL_ENABLED="true"
export MAIL_FROM="AshAI <your-verified-address@gmail.com>"
export BREVO_API_KEY="your-brevo-api-key"
```

Register these authorization callback URLs with the providers:

- Google: `http://localhost:8080/login/oauth2/code/google`
- GitHub: `http://localhost:8080/login/oauth2/code/github`

For GitHub, set the homepage URL to `http://localhost:5500`. OAuth secrets must
remain in environment variables and must never be committed.

For deployment, replace `FRONTEND_URL` with the public HTTPS frontend origin and
register the public OAuth callback URLs. The included Nginx container proxies
`/api`, `/oauth2`, and `/login/oauth2` to the backend for same-origin requests.

Create the `MAIL_FROM` sender in Brevo and verify it using the code Brevo sends
to that address. Brevo is the preferred provider because its HTTPS API works on
Render's free plan. Resend and SMTP remain optional fallbacks.
