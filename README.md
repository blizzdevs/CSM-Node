# CSM-Node

Modern MU Online CMS migrated from WebEngine (PHP) to Node.js/Express.

## Features
- **Modern UI**: High-end "Heaven UI" with TERA-inspired centered design.
- **Backend**: Node.js, Express, Prisma ORM (SQL Server).
- **Core Logic**: 1:1 functional parity with legacy WebEngine logic (Auth, Rankings, Cache).
- **Security**: Robust encryption (MD5, SHA256, WZMD5), CSRF protection, and Failed Login Attempt (FLA) tracking.

## Installation
1. Clone the repository.
2. Run `npm install`.
3. Configure your `.env` following `.env.example`.
4. Run `npm run dev`.

## Environment
- Node.js 20+
- SQL Server (MuOnline DB)
