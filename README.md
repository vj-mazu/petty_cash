# MRN Industries - Cash Management System

A comprehensive financial management system built with React.js frontend and Node.js backend for tracking transactions, managing ledgers, and handling anamath (credit) records.

**✅ FULLY AUTOMATED SETUP** - Everything runs automatically when you start the backend server!

## 🚀 Quick Start for Clients

### Prerequisites
- Node.js (v18 or higher) - [Download](https://nodejs.org/)
- PostgreSQL (v12 or higher) - [Download](https://www.postgresql.org/download/)

### Installation Steps

1. **Install Node.js and PostgreSQL**
2. **Create Database:**
   ```cmd
   psql -U postgres
   CREATE DATABASE cash_management;
   \q
   ```
3. **Install Dependencies:**
   ```cmd
   cd backend
   npm install
   
   cd frontend
   npm install
   ```
4. **Start Backend (Everything Auto-Runs!):**
   ```cmd
   cd backend
   node server.js
   ```
   This automatically:
   - ✅ Creates all database tables
   - ✅ Runs all 10 migrations
   - ✅ Applies high-level performance optimizations
   - ✅ Optimizes for 40,000+ transactions
   - ✅ Creates default admin users
   - ✅ Sets up all indexes and background services

5. **Start Frontend:**
   ```cmd
   cd frontend
   npm start
   ```

6. **Login with:**
   - Email: `admin1@petticash.com`
   - Password: `Admin123!`

**📖 See [CLIENT_INSTALLATION_GUIDE.md](CLIENT_INSTALLATION_GUIDE.md) for detailed instructions**

---

## ✨ Features

### 📊 Transaction Management
- **Daily Transaction Recording**: Add credit/debit transactions with detailed information
- **Transaction Categories**: Organize transactions by ledgers and types
- **Running Balance Tracking**: Real-time balance calculations
- **Transaction Numbers**: Auto-generated unique transaction references
- **PDF & Excel Export**: Export transaction records in multiple formats

### 💳 Anamath (Credit) System
- **Anamath Entry Creation**: Record credit transactions with detailed tracking
- **Closing Records**: Mark anamath entries as closed with completion dates
- **Unique ID Generation**: Auto-generated anamath reference numbers
- **Comprehensive Reporting**: Track opening and closing anamath records

### 📈 Ledger Management
- **Multi-Ledger Support**: Create and manage multiple financial ledgers
- **Ledger-wise Reports**: Generate reports filtered by specific ledgers
- **Balance Tracking**: Monitor individual ledger balances



```### 📋 Reporting & Analytics

cash/- **Daily Reports**: Generate daily transaction summaries

├── COMPLETE_SETUP.bat          # One-click setup script- **PDF Export**: Professional PDF reports with company branding

├── backend/                    # Backend API server- **Excel Export**: Detailed Excel reports with formatting

│   ├── comprehensive-test-data.js    # Test data generator- **Date Range Filtering**: Filter reports by custom date ranges

│   ├── performance-optimizer.js      # Database optimization- **Opening/Closing Balance Reports**: Track account balances over time

│   ├── server.js              # Main server file

│   ├── start.js               # Startup script with auto-migration### 👥 User Management

│   ├── models/                # Database models- **Authentication System**: Secure login and user management

│   ├── routes/                # API routes- **Role-based Access**: Different permission levels for users

│   ├── middleware/            # Custom middleware- **User Settings**: Customizable user preferences

│   └── migrations/            # Database migrations

├── frontend/                  # React frontend### ⚙️ System Features

└── package.json              # Root dependencies- **Opening Balance Management**: Set and track opening balances

```- **System Settings**: Configurable system parameters

- **Audit Logging**: Track all system activities

## 🔥 Key Features- **Rate Limiting**: API protection and security measures



### Enhanced Search## 🏗️ Project Structure

- **Anamath Records**: Search by ledger name and anamath ID (case-insensitive)

- **Advanced Filtering**: Date ranges, ledger types, transaction types```

- **Real-time Results**: Fast search with optimized database queriescash/

├── frontend/                 # React.js Frontend Application

### Performance Optimized│   ├── src/

- **Database Indexes**: Strategic indexes for fast queries│   │   ├── components/      # Reusable React components

- **Connection Pooling**: Efficient database connections│   │   ├── pages/          # Main application pages

- **Compression**: Gzip compression for API responses│   │   ├── services/       # API service functions

- **Caching**: Intelligent caching for frequently accessed data│   │   ├── utils/          # Utility functions and helpers

│   │   └── App.tsx         # Main application component

### Comprehensive Testing│   ├── public/             # Static assets

- **Daily Test Data**: Automated generation from April 1st to current date│   └── package.json        # Frontend dependencies

- **15 Transactions/Day**: Realistic transaction patterns│

- **Credit/Debit Mix**: Balanced transaction types├── backend/                 # Node.js Backend API

- **Validation Tools**: Built-in data validation│   ├── controllers/        # API route controllers

│   ├── models/            # Database models

## 🛠️ Available Commands│   ├── routes/            # API route definitions

│   ├── middleware/        # Express middleware

### Backend Commands│   ├── migrations/        # Database migration scripts

```bash│   ├── config/            # Configuration files

# Start the application│   ├── logs/              # Application logs

npm start│   └── package.json       # Backend dependencies

│

# Generate test data (15 transactions/day from April 1st)└── README.md              # This file

npm run test-data:generate```



# Clean up test data## 🛠️ Technology Stack

npm run test-data:cleanup

### Frontend

# Validate test data- **React.js 18+** - Modern React with hooks and functional components

npm run test-data:validate- **TypeScript** - Type-safe development

- **Tailwind CSS** - Utility-first CSS framework

# Optimize database performance- **React Hook Form** - Form validation and management

node performance-optimizer.js all- **React Router** - Client-side routing

- **Axios** - HTTP client for API requests

# Production mode- **date-fns** - Date manipulation and formatting

npm run production- **jsPDF** - PDF generation

```- **React Toastify** - Toast notifications

- **Lucide React** - Modern icon library

### Frontend Commands

```bash### Backend

cd frontend- **Node.js** - JavaScript runtime

npm start                # Development mode- **Express.js** - Web framework

npm run build           # Production build- **PostgreSQL** - Relational database

```- **Sequelize** - ORM for database operations

- **JWT** - Authentication tokens

## 🔧 Configuration- **bcrypt** - Password hashing

- **cors** - Cross-origin resource sharing

### Database Configuration (backend/.env)- **express-rate-limit** - API rate limiting

```env

DB_HOST=localhost## 📋 Prerequisites

DB_PORT=5432

DB_NAME=cash_managementBefore running this application, ensure you have the following installed:

DB_USER=postgres

DB_PASSWORD=your_password- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)

- **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)

JWT_SECRET=your-secret-key- **npm** or **yarn** - Package manager (comes with Node.js)

PORT=3001

NODE_ENV=development## ⚡ Quick Start

FRONTEND_URL=http://localhost:3000

```### 1. Clone the Repository

```bash

### Default Usersgit clone <repository-url>

- **Admin**: admin / admin123cd cash

- **User**: user / user123```



## 📊 Performance Features### 2. Database Setup

1. Install PostgreSQL and create a database named `petti_cash`

### Database Optimizations2. Update database credentials in `backend/config/database.js`

- **Strategic Indexes**: Date, ledger, and amount-based indexes3. Run database migrations:

- **Query Optimization**: Analyzed queries for best performance```bash

- **Connection Pooling**: Efficient database connectionscd backend

- **Vacuum & Analyze**: Automated database maintenancenpm install

npm run migrate

### Application Performance```

- **Gzip Compression**: Reduced response sizes

- **Response Caching**: Intelligent caching layer### 3. Backend Setup

- **Rate Limiting**: Protection against abuse```bash

- **Memory Management**: Optimized memory usagecd backend

npm install

## 🧪 Testing & Validationnpm run seed    # Optional: Add sample data

npm start       # Starts backend server on port 5000

### Comprehensive Test Data```

The system includes a comprehensive test data generator that creates:

- **Daily transactions** from April 1st, 2025 to current date### 4. Frontend Setup

- **15 transactions per day** with realistic patterns```bash

- **Mixed transaction types** (credit/debit)cd frontend

- **Varied amounts** with realistic business scenariosnpm install

npm start       # Starts development server on port 3000

### Performance Testing```

```bash

# Generate test data### 5. Access the Application

npm run test-data:generate- **Frontend**: http://localhost:3000

- **Backend API**: http://localhost:5000

# Validate data integrity- **Default Login**: Check backend/seed.js for default credentials

npm run test-data:validate

## 🔧 Configuration

# Optimize database

node performance-optimizer.js optimize### Backend Configuration

Update `backend/config/database.js` with your PostgreSQL credentials:

# Check performance settings```javascript

node performance-optimizer.js checkmodule.exports = {

```  development: {

    username: 'your_username',

## 🚀 Production Deployment    password: 'your_password',

    database: 'petti_cash',

### 1. Environment Setup    host: 'localhost',

- Update `.env` file with production values    dialect: 'postgresql'

- Set `NODE_ENV=production`  }

- Configure proper JWT secrets};

```

### 2. Database Optimization

```bash### Environment Variables

node performance-optimizer.js allCreate `.env` files in both frontend and backend directories:

```

**Backend `.env`:**

### 3. Security Considerations```

- Change default passwordsDATABASE_URL=postgresql://username:password@localhost:5432/petti_cash

- Update JWT secretsJWT_SECRET=your_jwt_secret_key

- Configure CORS properlyPORT=5000

- Enable HTTPS```



### 4. Monitoring**Frontend `.env`:**

- Check logs in `backend/logs/````

- Monitor database performanceREACT_APP_API_URL=http://localhost:5000/api

- Set up automated backups```



## 📈 Performance Benchmarks## � API Documentation



### System Capabilities### Authentication Endpoints

- **50,000+ transactions**: Efficiently handled- `POST /api/auth/login` - User login

- **Sub-second queries**: With proper indexing- `POST /api/auth/register` - User registration

- **Concurrent users**: Supports multiple simultaneous users- `GET /api/auth/me` - Get current user

- **Real-time search**: Fast search across all records

### Transaction Endpoints

### Database Performance- `GET /api/transactions` - Get all transactions

- **Optimized indexes** for common query patterns- `POST /api/transactions` - Create new transaction

- **Efficient joins** between related tables- `PUT /api/transactions/:id` - Update transaction

- **Pagination support** for large datasets- `DELETE /api/transactions/:id` - Delete transaction

- **Database maintenance** scripts included

### Anamath Endpoints

## 🔍 Search Features- `GET /api/anamath-entries` - Get all anamath entries

- `POST /api/anamath-entries` - Create new anamath entry

### Anamath Records Search- `PUT /api/anamath-entries/:id/close` - Close anamath entry

- **Ledger Name**: Case-insensitive search

- **Anamath ID**: UUID-based search### Ledger Endpoints

- **Combined Search**: Search across multiple fields- `GET /api/ledgers` - Get all ledgers

- **Real-time Results**: Instant search results- `POST /api/ledgers` - Create new ledger

- `PUT /api/ledgers/:id` - Update ledger

### Advanced Filtering

- **Date Ranges**: Filter by specific date periods### Export Endpoints

- **Amount Ranges**: Filter by transaction amounts- `GET /api/exports/transactions/pdf` - Export transactions as PDF

- **Transaction Types**: Credit/Debit filtering- `GET /api/exports/transactions/excel` - Export transactions as Excel

- **Ledger Types**: Filter by ledger categories

## � Deployment

## 🛡️ Security Features

### Production Build

- **JWT Authentication**: Secure token-based auth```bash

- **Password Hashing**: bcrypt for secure passwords# Build frontend

- **CORS Protection**: Configurable cross-origin policiescd frontend

- **Rate Limiting**: Protection against abusenpm run build

- **Input Validation**: Comprehensive input sanitization

# The build files will be in frontend/build/

## 📞 Support & Troubleshooting```



### Common Issues### Database Migration for Production

```bash

1. **Database Connection Failed**cd backend

   - Check PostgreSQL is runningnpm run migrate:prod

   - Verify credentials in .env file```

   - Ensure database exists

### Production Environment Variables

2. **Dependencies Installation Failed**Ensure production environment variables are set:

   - Check Node.js version (v18+)```bash

   - Clear npm cache: `npm cache clean --force`NODE_ENV=production

   - Delete node_modules and reinstallDATABASE_URL=your_production_database_url

JWT_SECRET=your_secure_jwt_secret

3. **Performance Issues**```

   - Run database optimization: `node performance-optimizer.js all`

   - Check database indexes## 📝 Usage Guide

   - Monitor logs for errors

### Adding Transactions

### Getting Help1. Navigate to "Create Transaction" page

- Check logs in `backend/logs/`2. Select transaction type (Credit/Debit)

- Run validation: `npm run test-data:validate`3. Choose ledger and enter amount

- Check database status: `node performance-optimizer.js check`4. Add description and submit



## 📝 License### Managing Anamath Records

1. Go to "Anamath" section

This project is licensed under the ISC License.2. Create new anamath entry with details

3. Track and close entries when complete

---

### Generating Reports

**Last Updated**: October 6, 20251. Visit "Transactions" page

**Version**: 1.0.02. Apply date range filters

**Status**: Production Ready ✅3. Export as PDF or Excel format

### System Administration
1. Access "Settings" for system configuration
2. Manage users in "Users" section
3. Set opening balances in "Opening Balance"

## � Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify PostgreSQL is running
- Check database credentials in config
- Ensure database exists

**Port Already in Use**
- Check if ports 3000 or 5000 are already occupied
- Change ports in package.json scripts if needed

**Build Errors**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## � Support

For support and questions:
- Create an issue in the repository
- Check documentation in the `/docs` folder
- Review error logs in `backend/logs/`

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added PDF export features
- **v1.2.0** - Enhanced anamath management
- **v1.3.0** - Improved UI and reporting

## 🙏 Acknowledgments

- Built for MRN Industries
- Uses open-source libraries and frameworks
- Special thanks to the React and Node.js communities

---

**Last Updated**: December 2024  
**Version**: 1.3.0
