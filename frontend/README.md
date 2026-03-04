# Cash Management System - Frontend

A modern, responsive React frontend for the Cash Management System with authentication, ledger management, and transaction tracking.

## Features

### 🔐 Authentication System
- **4-Level Role-Based Access Control**:
  - Admin: Full system access and user management
  - Manager: Can manage own resources + view others
  - Accountant: Can create/edit own ledgers and transactions
  - Viewer: Read-only access to own resources

### 💼 Accounting Features
- **Opening Balance Management**: Set and track initial account balances
- **Credit/Debit Transactions**: Record incoming and outgoing funds
- **Real-time Balance Calculation**: Live balance updates using the formula: Opening Balance + Credits - Debits
- **Unlimited Ledger Creation**: Create as many ledgers as needed
- **Transaction History**: Complete audit trail with search and filtering

### 🎨 User Interface
- **Fully Animated**: Smooth transitions and interactions using Framer Motion
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Modern UI**: Clean, professional design with Tailwind CSS
- **Dark/Light Theme**: Consistent color scheme throughout
- **Interactive Forms**: Real-time validation and user feedback

### 📊 Dashboard
- **Financial Overview**: Total balance, credits, debits, and net position
- **Recent Transactions**: Quick view of latest activities
- **Quick Actions**: Fast access to create ledgers and transactions
- **Ledger Summary**: Breakdown by ledger type (Asset, Liability, Equity, Revenue, Expense)

## Technology Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Hook Form** with Yup validation
- **Axios** for API communication
- **React Router** for navigation
- **React Toastify** for notifications
- **Date-fns** for date handling
- **Lucide React** for icons

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API running on http://localhost:5000

## Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
Create a `.env` file in the root directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
GENERATE_SOURCEMAP=false
```

3. **Start the development server**:
```bash
npm start
```

The application will open at `http://localhost:3000`

## Available Scripts

### Development
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run eject      # Eject from Create React App
```

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Layout.tsx       # Main application layout
│   ├── ProtectedRoute.tsx # Route protection component
│   └── LoadingSpinner.tsx # Loading indicator
├── contexts/            # React Context providers
│   └── AuthContext.tsx  # Authentication state management
├── pages/              # Page components
│   ├── Login.tsx       # Login page
│   ├── Register.tsx    # Registration page
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Ledgers.tsx     # Ledgers listing
│   ├── CreateLedger.tsx # Create ledger form
│   ├── Transactions.tsx # Transactions listing
│   └── CreateTransaction.tsx # Create transaction form
├── services/           # API service layer
│   └── api.ts          # API client and types
├── App.tsx             # Main app component with routing
└── index.tsx           # Application entry point
```

## Key Features Implementation

### Authentication Flow
1. **Login/Register**: JWT token-based authentication
2. **Token Storage**: Secure token storage in localStorage
3. **Auto-refresh**: Automatic token validation on app load
4. **Route Protection**: Role-based route access control

### Accounting Logic
- **Balance Calculation**: Opening Balance + Credits - Debits = Current Balance
- **Transaction Types**: Credit (money in) and Debit (money out)
- **Real-time Updates**: Balance updates immediately after transactions
- **Audit Trail**: Complete transaction history with timestamps

### UI/UX Features
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Smooth Animations**: Page transitions and component animations
- **Form Validation**: Real-time validation with helpful error messages
- **Loading States**: Visual feedback during API operations
- **Toast Notifications**: Success/error messages for user actions

## Role-Based Access Control

### Admin
- Full access to all features
- User management capabilities
- Can delete any ledgers/transactions
- View all users' data

### Manager  
- Can manage own resources
- Can view others' ledgers/transactions
- Can delete own ledgers/transactions
- Limited user management

### Accountant
- Can create/edit own ledgers
- Can create/edit/view own transactions
- Cannot delete ledgers/transactions
- Cannot view others' data

### Viewer
- Read-only access to own data
- Cannot create/edit/delete anything
- Can view own ledgers and transactions

## API Integration

The frontend communicates with the backend API using Axios with:
- **Automatic token attachment**: JWT tokens added to all requests
- **Error handling**: Centralized error processing
- **Response interceptors**: Automatic logout on token expiry
- **Type safety**: Full TypeScript integration

## Styling System

### Tailwind CSS Classes
- **Custom components**: Pre-defined button, input, and card styles
- **Color scheme**: Consistent primary, success, danger, and warning colors
- **Responsive utilities**: Mobile-first responsive design
- **Animation classes**: Custom animation utilities

### Component Library
- **Buttons**: Primary, secondary, and danger variants
- **Forms**: Styled input fields with icons and validation
- **Cards**: Consistent card layout throughout the app
- **Badges**: Status indicators and role badges

## Performance Optimizations

- **Code splitting**: Lazy loading of routes (can be added)
- **Memoization**: React.memo for expensive components
- **Optimized images**: Efficient asset loading
- **Efficient re-renders**: Proper dependency arrays in hooks

## Security Features

- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Token-based authentication
- **Secure Storage**: Proper token management
- **Route Protection**: Role-based access control

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Guidelines

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting for consistency
- **Prettier**: Code formatting (can be added)
- **Component naming**: PascalCase for components

### State Management
- **React Context**: For global state (authentication)
- **Local state**: useState for component-specific state
- **Form state**: React Hook Form for form management

### Error Handling
- **Try-catch blocks**: Proper error catching in async operations
- **User feedback**: Clear error messages via toast notifications
- **Fallback UI**: Error boundaries for component errors

## Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
```env
# Production environment
REACT_APP_API_URL=https://your-api-domain.com/api
GENERATE_SOURCEMAP=false
```

### Hosting Options
- **Netlify**: Easy deployment with continuous integration
- **Vercel**: Optimized for React applications
- **AWS S3 + CloudFront**: Scalable static hosting
- **GitHub Pages**: Free hosting for open source projects

## Troubleshooting

### Common Issues

1. **API Connection Issues**:
   - Check if backend is running on correct port
   - Verify REACT_APP_API_URL in .env file
   - Check network/firewall settings

2. **Authentication Problems**:
   - Clear localStorage and try again
   - Check if JWT token is valid
   - Verify backend authentication endpoint

3. **Build Errors**:
   - Delete node_modules and package-lock.json
   - Run `npm install` again
   - Check for TypeScript errors

4. **Styling Issues**:
   - Ensure Tailwind CSS is properly configured
   - Check if PostCSS is working correctly
   - Verify import order in index.css

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.