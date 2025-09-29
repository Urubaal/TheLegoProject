# Frontend - LEGO Purchase Suggestion System

Frontend application for LEGO collection management with modern user interface supporting authentication, collection management, and set tracking.

## 📁 Files

### Core Pages
- `index.html` - Main login page
- `home.html` - Dashboard home page
- `dashboard.html` - User dashboard with collection management
- `lego-collection.html` - Collection view and management
- `set-detail.html` - Individual set details

### Assets
- `styles.css` - CSS styles with responsive design
- `script.js` - JavaScript logic and API communication
- `dashboard.js` - Dashboard functionality
- `collection-view.js` - Collection management
- `set-detail.js` - Set detail functionality
- `images/` - LEGO set images and icons

## 🎨 UI Features

### Authentication
- **Registration** - name, email and password with validation
- **Login** - email and password with validation
- **Password Reset** - sending link to email
- **Password Recovery** - setting new password

### Collection Management
- **Dashboard** - Overview of user's collection and statistics
- **Set Management** - Add, edit, and remove LEGO sets
- **Wishlist** - Track wanted sets with priority levels
- **Set Search** - Search for sets by number or name
- **Price Tracking** - Monitor set prices and trends

### Interactions
- Real-time validation
- Password visibility toggles
- Loading animations
- Success/error notifications
- Smooth transitions between forms

### Responsiveness
- Works on desktop, tablet and mobile
- Flexible layout
- Optimization for different resolutions

## 🔧 Configuration

### API Endpoint
In `script.js` file set the backend URL:
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

### Features
- User registration with validation
- Automatic login status checking
- User remembering
- JWT token handling
- Redirects after login/registration
- Password strength validation

## 🚀 Running

1. **Open `index.html` file in browser**
2. **Or run local server:**
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx http-server . -p 8000
   ```

## 🎯 Usage

1. **Registration:** Click "Sign up" link, enter name, email and password
2. **Login:** Enter email and password
3. **Password Reset:** Click "Forgot password?" and enter email
4. **New Password:** Click link from email and set new password

## 🔄 Backend Integration

Frontend communicates with backend via REST API:

### Authentication
- `POST /api/auth/register` - user registration
- `POST /api/auth/login` - user login
- `POST /api/auth/forgot-password` - password reset request
- `POST /api/auth/reset-password` - password reset with token
- `GET /api/auth/profile` - get user profile
- `POST /api/auth/logout` - user logout

### Collection Management
- `GET /api/profile/collection` - get user collection
- `POST /api/profile/collection/sets` - add set to collection
- `POST /api/profile/collection/wanted-sets` - add set to wishlist
- `PUT /api/profile/collection/:type/:id` - edit collection item
- `DELETE /api/profile/collection/:type/:id` - remove collection item

### Set Search
- `GET /api/profile/search/sets` - search for sets
- `GET /api/profile/search/minifigs` - search for minifigures

## ✅ Validation Rules

### Registration Form:
- **Name:** 2-50 characters, required
- **Email:** Valid email format, required
- **Password:** Minimum 6 characters, required
- **Confirm Password:** Must match password, required

### Login Form:
- **Email:** Valid email format, required
- **Password:** Required
- **Remember Me:** Optional checkbox for extended session

### Password Reset:
- **Email:** Valid email format, required
- **New Password:** Minimum 6 characters, required
- **Confirm Password:** Must match new password, required

## 📱 Responsiveness

- **Desktop:** Full layout with hover effects
- **Tablet:** Adapted for medium screens
- **Mobile:** Stacked layout, large buttons

## 🎨 Styling

- Modern gradient background
- Smooth animations and transitions
- Material Design inspirations
- Accessibility-friendly colors
