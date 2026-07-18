<div align="center">

# Expense Tracker 2.0

### A secure TypeScript backend for personal finance, categories, and transaction tracking.

<p>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

<p>
  <a href="./APIDOCS.md">API Docs</a>
  ·
  <a href="#primary-goal">Primary Goal</a>
  ·
  <a href="#project-structure">Folder Structure</a>
  ·
  <a href="#getting-started">Getting Started</a>
  ·
  <a href="#run-locally">Run Locally</a>
</p>

</div>

---

## Overview

Expense Tracker 2.0 is a TypeScript, Express, MongoDB, and Redis backend for tracking income and expense transactions. It includes email/password authentication, email verification, JWT cookies, password reset emails, category management, transaction management, Cloudinary avatar uploads, request validation, rate limiting, logging, and background email jobs.

## Primary Goal

The primary goal of this project is to provide a clean, secure, and scalable backend foundation for an expense tracking application. It focuses on real-world backend responsibilities: authentication, user-owned financial data, validation, caching, background jobs, file uploads, and production-friendly API structure.

| Goal | How this project handles it |
| --- | --- |
| Secure user access | JWT authentication, HTTP-only cookies, password hashing, and protected routes. |
| Reliable onboarding | Email OTP verification before account activation. |
| Organized finance data | User-scoped categories and transactions for income and expenses. |
| Better performance | Redis caching for repeated category and transaction reads. |
| Async communication | BullMQ workers for verification and password emails. |
| API maintainability | Controllers, routes, models, validators, services, and middleware are separated by responsibility. |

## Tech Stack

| Area | Tools |
| --- | --- |
| Runtime | Node.js |
| Language | TypeScript |
| Server | Express 5 |
| Database | MongoDB, Mongoose |
| Cache and queue | Redis, ioredis, BullMQ |
| Authentication | JWT, bcrypt, HTTP-only cookies |
| File uploads | Multer, Cloudinary |
| Email | Nodemailer, Mailgen |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Winston, Morgan |
| Validation | express-validator |
| Local services | Docker Compose |

## Features

| Module | Description |
| --- | --- |
| Authentication | Register with email OTP, verify account, login, logout, refresh tokens, and fetch current user. |
| Password recovery | Send password reset email and reset password with a secure token. |
| User profile | Upload and replace avatar images through Cloudinary. |
| Categories | Seed default categories and manage user-created income/expense categories. |
| Transactions | Create, list, update, and delete user-owned income and expense records. |
| Performance | Cache category and transaction reads in Redis. |
| Background jobs | Send verification and password emails with BullMQ workers. |
| Protection | Apply global and auth-specific rate limits with standard JSON errors. |

## Project Structure

```text
Expense-Tracker/
└── server/
    ├── docker-compose.yml
    ├── package.json
    ├── package-lock.json
    ├── bun.lock
    ├── tsconfig.json
    └── src/
        ├── app.ts                         # Express app, middleware, route mounting
        ├── index.ts                       # App bootstrap and MongoDB connection
        ├── constants.ts                   # Shared enums and database name
        ├── configs/
        │   └── env.configs.ts             # Loads runtime environment variables
        ├── controllers/
        │   ├── categories.controllers.ts  # Category handlers
        │   ├── transctions.controllers.ts # Transaction handlers
        │   └── user.controllers.ts        # Auth and user handlers
        ├── db/
        │   ├── mongoconnect.db.ts         # MongoDB connection
        │   └── redisconnect.db.ts         # Redis connection
        ├── jobs/
        │   ├── queue.jobs.ts              # BullMQ queue setup
        │   └── worker.jobs.ts             # Email worker
        ├── middlewares/
        │   ├── auth.middlewares.ts        # JWT authentication
        │   ├── error.middlewares.ts       # Central error handler
        │   ├── multer.middlewares.ts      # File upload middleware
        │   ├── notfound.middlewares.ts    # 404 handler
        │   └── rateLimiters.middlewares.ts# Auth route rate limiters
        ├── models/
        │   ├── categories.models.ts       # Category schema
        │   ├── transactions.models.ts     # Transaction schema
        │   └── user.models.ts             # User schema and token methods
        ├── routes/
        │   ├── categories.routes.ts       # Category routes
        │   ├── transctions.routes.ts      # Transaction routes
        │   └── user.routes.ts             # User/auth routes
        ├── services/
        │   └── categories.services.ts     # Default category seeding
        ├── utils/
        │   ├── ApiError.ts                # Error response class
        │   ├── ApiResponse.ts             # Success response class
        │   ├── asyncHandler.ts            # Async route wrapper
        │   ├── defaultCategories.ts       # Initial categories
        │   ├── logger.ts                  # Winston logger
        │   ├── mail.ts                    # Email templates and sender
        │   ├── pagination.ts              # Pagination helper
        │   └── uploadCloudinary.ts        # Cloudinary upload/delete helpers
        └── validators/
            ├── validate.ts                # Validation result middleware
            ├── auth/
            │   └── auth.validators.ts     # Auth validators
            └── others/
                ├── category.validators.ts # Category validators
                └── transctions.validators.ts # Transaction validators
```

Generated folders such as `node_modules/` and `dist/` are intentionally omitted from this structure.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Ritamnandy/Expense-Tracker-2.0.git
cd Expense-Tracker-2.0/server
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create `server/.env` locally. Do not commit this file.

```bash
cp .env.sample .env
```

Required variables used by the application:

```text
PORT
CORS_ORIGIN
MONGODB_URL
REDIS_HOST
REDIS_PORT
BCRYPT_SALT_ROUNDS
JWT_TOKEN_SECRET
JWT_TOKEN_EXPIRES_IN
REFRESH_TOKEN_SECRET
REFRESH_TOKEN_EXPIRES_IN
EMAIL
APP_PASSWORD
FONTEND_RESET_PASSWORD_URL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

## Run Locally

Start MongoDB and Redis with Docker Compose:

```bash
docker compose up -d
```

Run the API in development mode:

```bash
npm run dev
```

Build TypeScript:

```bash
npm run build
```

Run the compiled server:

```bash
npm start
```

## API Base URL

```text
http://localhost:<PORT>/api/v1
```

Main route groups:

- `/users`
- `/categories`
- `/transactions`

Detailed endpoint documentation is available in [APIDOCS.md](./APIDOCS.md).

## Authentication

The API uses JWT access and refresh tokens. Login and email verification set `AccessToken` and `RefreshToken` HTTP-only cookies. Protected routes also accept an access token in the `Authorization` header:

```text
Authorization: Bearer <access_token>
```

## Response Format

Successful responses generally use:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Success message",
  "data": {}
}
```

Error responses generally use:

```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "message": "Error message",
  "errors": ["Detailed error"]
}
```

## Notes

- The server loads environment variables from `server/.env`.
- MongoDB connects to the `expense-tracker` database name.
- Redis is used for OTP storage, password reset tokens, short-lived read caching, and BullMQ.
- Default categories are created after a user verifies email successfully.
- Avatar upload accepts JPEG, JPG, PNG, and WEBP files up to 5 MB.
- Current transaction route handlers expect a `categoryId` in some places, but the route definitions do not currently expose that parameter. See `APIDOCS.md` for details.
