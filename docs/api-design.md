# AshAI REST API Specification

Base Endpoint: `http://localhost:8080/api`

## Authentication Endpoints (`/api/auth`)
- **POST `/api/auth/register`**: Register a new user (`fullName`, `email`, `password`).
- **POST `/api/auth/login`**: Authenticate credentials and receive a JWT token (`email`, `password`).
- **GET `/api/auth/verify-email?token={token}`**: Validate single-use email verification token.
- **POST `/api/auth/forgot-password`**: Request password reset email for an account (`email`).
- **POST `/api/auth/reset-password`**: Complete password reset (`token`, `newPassword`).

## AI Chat Endpoints (`/api/chat`)
- **POST `/api/chat`** *(Secured)*: Send prompt message to AI Assistant.
  - Body: `{ "message": "...", "conversationId": "...", "model": "..." }`
  - Response: `{ "reply": "...", "conversationId": "...", "model": "...", "timestamp": "..." }`

## User Profile Endpoints (`/api/profile`)
- **GET `/api/profile`** *(Secured)*: Get authenticated user details.
- **PUT `/api/profile`** *(Secured)*: Update user profile (`fullName`, `bio`, `avatarUrl`).
- **PUT `/api/profile/password`** *(Secured)*: Change account password (`currentPassword`, `newPassword`).
