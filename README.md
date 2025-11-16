## Backend – User Registration API

NestJS service that powers the React authentication frontend.

## Features

- User registration with bcrypt password hashing
- JWT authentication (access + refresh tokens) with Passport
- Protected profile endpoint consumed by the SPA

## Quick Start

```bash
npm install
npm run start:dev
```

Server defaults to `http://localhost:3000`.

## Environment

Create `.env`:

```
MONGODB_URI=<connection string>
JWT_SECRET=<access secret>
JWT_EXPIRATION_TIME=15m
JWT_REFRESH_SECRET=<refresh secret>
JWT_REFRESH_EXPIRATION_TIME=7d
```

## NPM Scripts

- `npm run start:dev` – development watch mode
- `npm run test` – unit tests
- `npm run test:e2e` – e2e tests

## API Endpoints

| Method | Path             | Description           |
| ------ | ---------------- | --------------------- |
| POST   | `/user/register` | Create a new account  |
| POST   | `/auth/login`    | Issue access tokens   |
| POST   | `/auth/refresh`  | Refresh access token  |
| GET    | `/user/profile`  | Authenticated profile |

## Structure

```
src/
  app.module.ts
  auth/
  users/
```

Enable CORS when serving the frontend from another origin. Refresh tokens are returned as plain strings; the client stores them in `localStorage`.
