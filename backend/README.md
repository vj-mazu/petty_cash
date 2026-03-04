# Cash Management System - Backend

A comprehensive backend API for cash management system with 4-level authentication and accounting features.

## Features

- **4-Level Authentication System**:
  - Admin: Full system access
  - Manager: Can manage own resources + view others
  - Accountant: Can create/edit own ledgers and transactions
  - Viewer: Read-only access to own resources

- **Accounting System**:
  - Opening balance management
  - Credit/Debit transactions
  - Real-time balance calculations
  - Unlimited ledger creation
  - Transaction history and statistics

- **Security Features**:
  - JWT authentication
  - Password encryption with bcrypt
  - Rate limiting
  - Input validation
  - SQL injection protection

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the backend directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cash_management
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_complex
JWT_EXPIRE=7d

# Security
BCRYPT_ROUNDS=12
```

3. Set up PostgreSQL database:
```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Run the database setup script
\i database_setup.sql
```

4. Seed the database (optional):
```bash
npm run seed
```

## Running the Application

### Development mode:
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `GET /api/auth/users` - Get all users (Admin/Manager)
- `PUT /api/auth/users/:id/role` - Update user role (Admin)

### Ledgers
- `POST /api/ledgers` - Create ledger
- `GET /api/ledgers` - Get all ledgers
- `GET /api/ledgers/:id` - Get ledger by ID
- `PUT /api/ledgers/:id` - Update ledger
- `DELETE /api/ledgers/:id` - Delete ledger
- `GET /api/ledgers/summary` - Get ledgers summary

### Transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/stats` - Get transaction statistics

## Default Admin User
After running the seed script, you'll have a default admin user:
- **Admin**: admin@petticash.com / Admin123!
- **Manager**: manager@petticash.com / Manager123!
- **Accountant**: accountant@petticash.com / Accountant123!
- **Viewer**: viewer@petticash.com / Viewer123!

## Error Handling

The API returns consistent error responses:
```json
{
  "success": false,
  "message": "Error message",
  "errors": [] // Validation errors if any
}
```

## Success Responses

All successful responses follow this format:
```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

## Security Notes

- All passwords are hashed using bcrypt
- JWT tokens expire in 7 days by default
- Rate limiting is applied to all endpoints
- Authentication endpoints have stricter rate limits
- All inputs are validated and sanitized

## Database Schema

The system uses three main tables:
- `users` - User accounts and roles
- `ledgers` - Account ledgers with opening/current balances
- `transactions` - Individual debit/credit transactions

## Role-Based Access Control

- **Admin**: Full access to all resources
- **Manager**: Can manage own resources + read others
- **Accountant**: Can create/edit own ledgers and transactions
- **Viewer**: Read-only access to own resources only