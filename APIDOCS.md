<div align="center">

# Expense Tracker API Documentation

### REST API reference for authentication, categories, and transactions.

<p>
  <img src="https://img.shields.io/badge/API-REST-4B5563?style=for-the-badge" alt="REST API" />
  <img src="https://img.shields.io/badge/Auth-JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT Auth" />
  <img src="https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Cache-Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
</p>

<p>
  <a href="#endpoint-map">Endpoint Map</a>
  ·
  <a href="#users">Users</a>
  ·
  <a href="#categories">Categories</a>
  ·
  <a href="#transactions">Transactions</a>
  ·
  <a href="#common-status-codes">Status Codes</a>
</p>

</div>

---

## Base URL

```text
http://localhost:<PORT>/api/v1
```

## Authentication

Protected endpoints require one of:

```text
Authorization: Bearer <access_token>
```

or an `AccessToken` HTTP-only cookie issued by login/verification.

## Endpoint Map

| Group | Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- | --- |
| Users | `POST` | `/users/register` | Public | Start registration and send email OTP. |
| Users | `POST` | `/users/verify-email` | Public | Verify OTP, create user, seed defaults, set cookies. |
| Users | `POST` | `/users/re-send-verification-code` | Public | Resend registration OTP. |
| Users | `POST` | `/users/login` | Public | Login verified user and set cookies. |
| Users | `POST` | `/users/refresh-access-token` | Public body token | Issue new access and refresh tokens. |
| Users | `POST` | `/users/forget-password` | Public | Send password reset email. |
| Users | `POST` | `/users/reset-password` | Public | Reset password with token. |
| Users | `POST` | `/users/logout` | Required | Logout and clear cookies. |
| Users | `POST` | `/users/set-avatar` | Required | Upload avatar image. |
| Users | `GET` | `/users/current-user` | Required | Return authenticated user. |
| Categories | `POST` | `/categories` | Required | Create category. |
| Categories | `GET` | `/categories` | Required | List categories. |
| Categories | `PATCH` | `/categories/:categoryId` | Required | Update category. |
| Categories | `DELETE` | `/categories/:categoryId` | Required | Delete category. |
| Transactions | `POST` | `/transactions` | Required | Create transaction. See implementation note. |
| Transactions | `GET` | `/transactions` | Required | List transactions. |
| Transactions | `PATCH` | `/transactions/:transactionId` | Required | Update transaction. |
| Transactions | `DELETE` | `/transactions/:transactionId` | Required | Delete transaction. |
| Transactions | `GET` | `/transactions/by-category` | Required | List by category. See implementation note. |

## Shared Values

| Field | Allowed values |
| --- | --- |
| `type` | `income`, `expense` |
| `paymentMethod` | `cash`, `upi`, `credit_card`, `debit_card`, `net_banking`, `cheque`, `wallet`, `bank_transfer`, `auto_debit`, `other` |
| `currency` | 3-letter uppercase ISO 4217-style code, for example `INR` or `USD`. |

## Standard Responses

### Success

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Message",
  "data": {}
}
```

### Error

```json
{
  "statusCode": 400,
  "success": false,
  "data": null,
  "message": "Message",
  "errors": ["Error details"]
}
```

## Users

### Register

| Property | Value |
| --- | --- |
| Method | `POST` |
| Endpoint | `/users/register` |
| Auth | Public |
| Success | `200` |

Creates a temporary signup session in Redis and emails a verification OTP.

Body:

```json
{
  "firstName": "Ritam",
  "lastName": "Nandy",
  "email": "ritam@example.com",
  "password": "Password@123"
}
```

Validation:

| Field | Rule |
| --- | --- |
| `firstName` | Required, 3-20 characters, letters with spaces, apostrophes, or hyphens. |
| `lastName` | Required, 3-20 characters, letters with spaces, apostrophes, or hyphens. |
| `email` | Required, valid email, max 254 characters. |
| `password` | Required, 8-128 characters, must include lowercase, uppercase, number, and special character. |

### Verify Email

| Property | Value |
| --- | --- |
| Method | `POST` |
| Endpoint | `/users/verify-email` |
| Auth | Public |
| Success | `201` |

Verifies the OTP, creates the user, seeds default categories, and sets access/refresh token cookies.

Body:

```json
{
  "email": "ritam@example.com",
  "token": "123456"
}
```

### Resend Verification Code

| Property | Value |
| --- | --- |
| Method | `POST` |
| Endpoint | `/users/re-send-verification-code` |
| Auth | Public |
| Success | `200` |

Sends a new OTP for an active signup session. A 60-second resend cooldown is enforced.

Body:

```json
{
  "email": "ritam@example.com"
}
```

### Login

| Property | Value |
| --- | --- |
| Method | `POST` |
| Endpoint | `/users/login` |
| Auth | Public |
| Success | `200` |

Authenticates a verified user and sets access/refresh token cookies.

Body:

```json
{
  "email": "ritam@example.com",
  "password": "Password@123"
}
```

### Refresh Access Token

| Property | Value |
| --- | --- |
| Method | `POST` |
| Endpoint | `/users/refresh-access-token` |
| Auth | Public, but requires refresh token body field |
| Success | `200` |

Issues a new access token and refresh token.

Body:

```json
{
  "refreshToken": "<refresh_token>"
}
```

Note: the controller also checks a refresh-token cookie, but the body validator currently requires `refreshToken`.

### Forgot Password

| Property | Value |
| --- | --- |
| Method | `POST` |
| Endpoint | `/users/forget-password` |
| Auth | Public |
| Success | `200` |

Sends a password reset email when the account exists and is verified. The response is intentionally generic.

Body:

```json
{
  "email": "ritam@example.com"
}
```

### Reset Password

| Property | Value |
| --- | --- |
| Method | `POST` |
| Endpoint | `/users/reset-password` |
| Auth | Public |
| Success | `200` |

Resets the password with a valid reset token and clears the stored refresh token.

Body:

```json
{
  "email": "ritam@example.com",
  "token": "<reset_token>",
  "newPassword": "NewPassword@123"
}
```

### Logout

| Property | Value |
| --- | --- |
| Method | `POST` |
| Endpoint | `/users/logout` |
| Auth | Required |
| Success | `200` |

Clears the user's refresh token and authentication cookies.

### Set Avatar

| Property | Value |
| --- | --- |
| Method | `POST` |
| Endpoint | `/users/set-avatar` |
| Auth | Required |
| Content type | `multipart/form-data` |
| Success | `200` |

Uploads an avatar image to Cloudinary.

Form field:

```text
avatar=<image file>
```

Validation:

- File is required.
- Allowed MIME types: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`.
- Maximum size: 5 MB.

### Current User

| Property | Value |
| --- | --- |
| Method | `GET` |
| Endpoint | `/users/current-user` |
| Auth | Required |
| Success | `200` |

Returns the authenticated user's public profile data.

## Categories

All category endpoints are protected.

### Create Category

| Property | Value |
| --- | --- |
| Method | `POST` |
| Endpoint | `/categories` |
| Auth | Required |
| Success | `201` |

Body:

```json
{
  "name": "food",
  "icon": "utensils",
  "type": "expense"
}
```

Validation:

| Field | Rule |
| --- | --- |
| `name` | Required, string, 1-20 characters. |
| `icon` | Required, string, 1-100 characters. |
| `type` | Required, `income` or `expense`. |

### List Categories

| Property | Value |
| --- | --- |
| Method | `GET` |
| Endpoint | `/categories` |
| Auth | Required |
| Cache | 10 minutes in Redis |
| Success | `200` |

Returns all categories owned by the authenticated user. Results are cached in Redis for 10 minutes.

### Update Category

| Property | Value |
| --- | --- |
| Method | `PATCH` |
| Endpoint | `/categories/:categoryId` |
| Auth | Required |
| Success | `200` |

Default categories cannot be updated.

Body:

```json
{
  "name": "groceries",
  "icon": "shopping-basket",
  "type": "expense"
}
```

All body fields are optional, but at least one field must be provided.

### Delete Category

| Property | Value |
| --- | --- |
| Method | `DELETE` |
| Endpoint | `/categories/:categoryId` |
| Auth | Required |
| Success | `200` |

Default categories cannot be deleted. A category with existing transactions cannot be deleted.

## Transactions

All transaction endpoints are protected.

### Create Transaction

| Property | Value |
| --- | --- |
| Method | `POST` |
| Endpoint | `/transactions` |
| Auth | Required |
| Success | `201` |

Body:

```json
{
  "type": "expense",
  "amount": 250,
  "transactionDate": "2026-07-19T10:30:00.000Z",
  "description": "Lunch",
  "currency": "INR",
  "paymentMethod": "upi"
}
```

Validation:

| Field | Rule |
| --- | --- |
| `type` | Required, `income` or `expense`. |
| `amount` | Required, numeric, minimum `0`. |
| `transactionDate` | Required, valid ISO 8601 date. |
| `description` | Required, string, max 100 characters. |
| `currency` | Required, 3 uppercase letters. |
| `paymentMethod` | Required, one of the allowed payment methods. |

Implementation note: the controller and validator expect a `categoryId` route parameter, but the current route is declared as `POST /transactions` without `/:categoryId`. As written, transaction creation cannot receive `categoryId` through the route path.

### List Transactions

| Property | Value |
| --- | --- |
| Method | `GET` |
| Endpoint | `/transactions` |
| Auth | Required |
| Cache | 3 minutes in Redis |
| Success | `200` |

Returns all transactions owned by the authenticated user, sorted by `transactionDate` descending. Results are cached in Redis for 3 minutes.

Possible error: `404` when no transactions exist.

### Update Transaction

| Property | Value |
| --- | --- |
| Method | `PATCH` |
| Endpoint | `/transactions/:transactionId` |
| Auth | Required |
| Success | `200` |

Body:

```json
{
  "amount": 300,
  "description": "Updated lunch",
  "paymentMethod": "cash"
}
```

All body fields are optional, but at least one field must be provided.

Updatable fields: `type`, `amount`, `transactionDate`, `description`, `currency`, `paymentMethod`.

### Delete Transaction

| Property | Value |
| --- | --- |
| Method | `DELETE` |
| Endpoint | `/transactions/:transactionId` |
| Auth | Required |
| Success | `200` |

Deletes a transaction owned by the authenticated user.

### Get Transactions By Category

| Property | Value |
| --- | --- |
| Method | `GET` |
| Endpoint | `/transactions/by-category` |
| Auth | Required |
| Cache | 3 minutes in Redis |

Implementation note: the controller and validator expect a `categoryId` route parameter, but the current route is declared as `GET /transactions/by-category` without `/:categoryId`. As written, this endpoint cannot receive `categoryId` through the route path.

Expected successful behavior after adding a category parameter would be to return transactions for the authenticated user and category.

## Rate Limits

| Scope | Limit |
| --- | --- |
| Global | 100 requests per 5 minutes per IP. |
| Register | 5 requests per 20 minutes. |
| Login | 5 requests per 20 minutes. |
| Verify email | 8 requests per 20 minutes. |
| Resend verification code | 5 requests per 20 minutes. |
| Forgot password | 5 requests per 20 minutes. |

## Common Status Codes

| Code | Meaning |
| --- | --- |
| `200` | Request completed successfully. |
| `201` | Resource created successfully. |
| `400` | Validation failed, invalid token, or bad request. |
| `401` | Missing or invalid authentication. |
| `403` | Operation blocked, for example updating/deleting a default category. |
| `404` | Resource not found. |
| `409` | Duplicate category or category has existing transactions. |
| `429` | Rate limit exceeded. |
| `500` | Internal server error. |
