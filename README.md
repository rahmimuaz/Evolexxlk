# Mobile Shop E-commerce Platform

A full-stack e-commerce platform for mobile devices and accessories built with the MERN stack.

## Project Structure

- `backend/` - Node.js/Express backend
- `admin/` - React admin dashboard
- `client/` - React client application

## Security Notice ⚠️

**IMPORTANT**: Never commit sensitive information like database credentials, API keys, or JWT secrets to version control. Always use environment variables for sensitive data.

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your actual values:
   ```
   MONGODB_URI=your_mongodb_connection_string_here
   PORT=5000
   JWT_SECRET=your_jwt_secret_key_here
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

### Admin Dashboard Setup

1. Navigate to the admin directory:
   ```bash
   cd admin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the admin dashboard:
   ```bash
   npm run dev
   ```

### Client Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the client application:
   ```bash
   npm run dev
   ```

## Security Best Practices

1. **Environment Variables**: Always use environment variables for sensitive data
2. **JWT Secrets**: Use strong, random JWT secrets (at least 32 characters)
3. **Database Security**: Use connection strings with proper authentication
4. **Input Validation**: All user inputs are validated on both frontend and backend
5. **Error Handling**: Proper error handling without exposing sensitive information
6. **CORS**: Configure CORS properly for production environments

## Features

### Admin Dashboard
- Product Management
  - Add new products with category-specific fields
  - Edit existing products
  - Delete products
  - View all products
- Order Management
  - View incoming orders
  - Approve/deny orders
  - Track order status

### Product Features
- Unique Product ID (PID-XXXXX)
- Category-specific product details
- Multiple image upload (1-5 images)
- Automatic product creation date

## Technologies Used

- Frontend: React.js, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB
- Authentication: JWT
- File Upload: Multer

## Recent Security Fixes

- ✅ Removed hardcoded database credentials
- ✅ Fixed npm security vulnerabilities
- ✅ Removed debug console.log statements
- ✅ Improved authentication middleware
- ✅ Added proper error handling
- ✅ Created .env.example template
