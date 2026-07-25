# AshAI Database Schema Design

Engine: PostgreSQL / H2 Database

## Tables

### `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique User Identifier |
| `full_name` | VARCHAR | NOT NULL | User's full display name |
| `email` | VARCHAR | NOT NULL, UNIQUE | User email address |
| `password` | VARCHAR | NOT NULL | BCrypt hashed password |
| `bio` | VARCHAR(500) | NULLABLE | User biography |
| `avatar_url` | VARCHAR | NULLABLE | Profile avatar image link |
| `role` | VARCHAR | NOT NULL (DEFAULT 'USER') | User authority role |
| `verified` | BOOLEAN | NOT NULL (DEFAULT FALSE) | Email verification status |
| `created_at` | TIMESTAMP | NOT NULL | Entity creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Entity last update timestamp |

### `verification_tokens`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Token ID |
| `token` | VARCHAR | NOT NULL, UNIQUE | UUID verification string |
| `user_id` | BIGINT | FOREIGN KEY (`users.id`) | Associated user |
| `expiry_date` | TIMESTAMP | NOT NULL | Expiry time |

### `password_reset_tokens`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Token ID |
| `token` | VARCHAR | NOT NULL, UNIQUE | UUID password reset string |
| `user_id` | BIGINT | FOREIGN KEY (`users.id`) | Associated user |
| `expiry_date` | TIMESTAMP | NOT NULL | Expiry time |
