# 🧱 TheLegoProject - Authentication System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)

Complete authentication system with registration, login, password reset and recovery functionality. Modern frontend with responsive design and secure backend API.

## 🌟 Features

- ✅ **User registration and login** with validation
- ✅ **Password reset** via email
- ✅ **Password recovery** with secure tokens
- ✅ **Responsive design** - works on all devices
- ✅ **Security** - JWT, password hashing, rate limiting
- ✅ **Modern UI** with animations and real-time validation

## 📁 Project Structure

```
TheLegoProject/
├── frontend/                 # Frontend application (HTML, CSS, JS)
│   ├── index.html           # Main login page
│   ├── styles.css           # CSS styles
│   └── script.js            # JavaScript logic
├── backend/                 # Backend API (Node.js/Express)
│   ├── server.js            # Main server
│   ├── package.json         # Node.js dependencies
│   ├── env.example          # Configuration example
│   ├── routes/              # API route definitions
│   │   └── auth.js          # Authentication routes
│   ├── controllers/         # Controllers
│   │   └── authController.js # Authentication controller
│   ├── middleware/          # Middleware
│   │   ├── auth.js          # Authentication middleware
│   │   └── errorHandler.js  # Error handling
│   ├── models/              # Data models
│   ├── utils/               # Utility tools
│   │   └── emailService.js  # Email service
│   └── tests/               # Tests
└── README.md               # This file
```

## 🚀 Quick Start

### 1. Clone repository
```bash
git clone https://github.com/Urubaal/TheLegoProject.git
cd TheLegoProject
```

### 2. Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

### 3. Frontend Setup
```bash
# Open frontend/index.html in browser
# Or run local HTTP server
python -m http.server 8000
```

## 📋 Requirements

- **Node.js** 18+ 
- **npm** 8+
- **Browser** with ES6+ support
- **Email SMTP** (optional for password reset)

## ⚙️ Configuration

### Backend (.env)
```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:8000
```

### Frontend (script.js)
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

## 🔧 Features

### Frontend
- ✅ **Login form** with validation
- ✅ **Password reset** - sending reset link via email
- ✅ **Password recovery** - setting new password
- ✅ **Responsive design** - works on all devices
- ✅ **Real-time validation**
- ✅ **Animations and visual effects**
- ✅ **Remember user** functionality

### Backend API
- ✅ **POST /api/auth/register** - User registration
- ✅ **POST /api/auth/login** - User login
- ✅ **POST /api/auth/forgot-password** - Password reset
- ✅ **POST /api/auth/reset-password** - Set new password
- ✅ **GET /api/auth/profile** - User profile
- ✅ **POST /api/auth/logout** - User logout
- ✅ **GET /api/health** - Server status

### Security
- ✅ **Password hashing** (bcrypt)
- ✅ **JWT tokens** with expiration
- ✅ **Rate limiting** - request throttling
- ✅ **CORS** - cross-origin configuration
- ✅ **Helmet** - security headers
- ✅ **Input validation** and sanitization

## 📧 Email Configuration

To send password reset emails, configure in `.env` file:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

**Note:** For Gmail, use app password, not regular password.

## 🧪 Testing

### API Testing
```bash
# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test password reset
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Frontend Testing
1. Open `frontend/index.html` in browser
2. Test all forms
3. Check responsiveness on different devices

## 🔄 Application Flow

1. **Login:**
   - User enters email and password
   - Frontend sends request to `/api/auth/login`
   - Backend verifies data and returns JWT token
   - Token is stored in localStorage

2. **Password Reset:**
   - User clicks "Forgot password?"
   - Enters email and submits form
   - Backend generates reset token and sends email
   - User clicks link in email

3. **Password Recovery:**
   - User is redirected to page with token
   - Enters new password
   - Backend verifies token and updates password

## 🛠️ Development

### Adding New Features
1. **Backend:** Add new endpoints in `routes/auth.js`
2. **Frontend:** Update `script.js` with new functions
3. **Styling:** Modify `styles.css` for new elements

### Database
Currently using in-memory storage. To add real database:
1. Install ORM (e.g., Mongoose for MongoDB)
2. Update `models/` with schemas
3. Modify controllers to work with database

## 📝 License

MIT License - you can freely use and modify the code.

## 🤝 Contributing

We welcome contributions! Check [CONTRIBUTING.md](CONTRIBUTING.md) to learn how you can help.

## 🐛 Bug Reports

If you found a bug, open an [Issue](https://github.com/Urubaal/TheLegoProject/issues) with problem description.

## ✨ Feature Requests

Have an idea for a new feature? Open a [Feature Request](https://github.com/Urubaal/TheLegoProject/issues/new/choose)!

## 🆘 Support

If you have questions or problems:
1. Check [Issues](https://github.com/Urubaal/TheLegoProject/issues)
2. Check server logs in console
3. Open developer tools in browser
4. Make sure all dependencies are installed

## 🌟 Stars

If you like the project, leave a ⭐ on GitHub!
