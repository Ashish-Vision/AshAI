# AshAI System Architecture

## Overview
AshAI is built as a modern, decoupled web application composed of a high-performance Spring Boot REST API backend, PostgreSQL database, and a clean, responsive vanilla HTML5/CSS3/JavaScript frontend interface.

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                       │
│  (HTML5, CSS Variables, ES Modules, Theme Engine)      │
└───────────────────────────┬─────────────────────────────┘
                            │ REST / JSON (JWT Auth)
┌───────────────────────────▼─────────────────────────────┐
│                 Spring Boot Backend (API)               │
│  ├── Security: Spring Security + JJWT                   │
│  ├── Core Services: UserService, AiService, EmailService│
│  └── Controllers: AuthController, ChatController, etc.  │
└───────────────────────────┬─────────────────────────────┘
                            │ JPA / Hibernate
┌───────────────────────────▼─────────────────────────────┐
│                 PostgreSQL Database                     │
│  ├── Users, VerificationTokens, PasswordResetTokens     │
└─────────────────────────────────────────────────────────┘
```

## Security Design
- **Authentication**: Stateless JSON Web Tokens (JWT) sent via `Authorization: Bearer <token>` HTTP headers.
- **Passwords**: BCrypt hashing with standard salt strength.
- **CORS**: Configured in `SecurityConfig` to restrict trusted client origins.
