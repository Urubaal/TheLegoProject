# Changelog - LEGO Purchase System

All notable changes to this project will be documented in this file.

## [2025-09-30] - Documentation & Error Handling Updates

### ✅ Added
- **Automatic Documentation Updates**: Script for maintaining up-to-date documentation
- **PostgreSQL Error Handling**: Specialized error codes handling in `errorHandler.js`
  - `23505` - unique_violation (duplicate entry)
  - `23503` - foreign_key_violation (referenced record not found)
  - `23502` - not_null_violation (required field missing)
  - `ECONNREFUSED` - database connection failed
  - `ENOTFOUND` - database host not found

- **Email Error Logging**: Enhanced logging in `emailService.js`
  - Structured logging with Winston
  - Detailed error context (email, messageId, errors)
  - Success/failure tracking

- **Database Pool Monitoring**: Event listeners in all models
  - Error logging with stack traces
  - Connection lifecycle tracking
  - Debug information for connection management

- **Redis Error Enhancement**: Improved error logging in `redisService.js`
  - Error codes in logs
  - Reconnection status tracking
  - Better error context

- **Environment Validation**: Startup validation in `server.js`
  - Required variables check (`JWT_SECRET`, `DATABASE_URL`)
  - Graceful failure with detailed error messages
  - Validation success logging

### 🔧 Technical Details
- **Files Modified**:
  - `backend/middleware/errorHandler.js`
  - `backend/utils/emailService.js`
  - `backend/utils/redisService.js`
  - `backend/server.js`
  - `backend/models/User.js`
  - `backend/models/LegoSet.js`
  - `backend/models/UserCollection.js`
  - `backend/models/OlxOffer.js`

- **Dependencies**: No new dependencies required
- **Breaking Changes**: None
- **Migration Required**: None

### 📊 Impact
- **Better Debugging**: Detailed error logs with context
- **Improved Stability**: Better error handling and recovery
- **Enhanced Monitoring**: Connection status tracking
- **Security**: Environment validation prevents misconfigurations
- **Documentation**: Automated updates prevent outdated docs

---

## [2025-09-30] - Documentation & Error Handling Updates

### ✅ Added
- **Automatic Documentation Updates**: Script for maintaining up-to-date documentation
- **PostgreSQL Error Handling**: Specialized error codes handling in `errorHandler.js`
  - `23505` - unique_violation (duplicate entry)
  - `23503` - foreign_key_violation (referenced record not found)
  - `23502` - not_null_violation (required field missing)
  - `ECONNREFUSED` - database connection failed
  - `ENOTFOUND` - database host not found

- **Email Error Logging**: Enhanced logging in `emailService.js`
  - Structured logging with Winston
  - Detailed error context (email, messageId, errors)
  - Success/failure tracking

- **Database Pool Monitoring**: Event listeners in all models
  - Error logging with stack traces
  - Connection lifecycle tracking
  - Debug information for connection management

- **Redis Error Enhancement**: Improved error logging in `redisService.js`
  - Error codes in logs
  - Reconnection status tracking
  - Better error context

- **Environment Validation**: Startup validation in `server.js`
  - Required variables check (`JWT_SECRET`, `DATABASE_URL`)
  - Graceful failure with detailed error messages
  - Validation success logging

### 🔧 Technical Details
- **Files Modified**:
  - `backend/middleware/errorHandler.js`
  - `backend/utils/emailService.js`
  - `backend/utils/redisService.js`
  - `backend/server.js`
  - `backend/models/User.js`
  - `backend/models/LegoSet.js`
  - `backend/models/UserCollection.js`
  - `backend/models/OlxOffer.js`

- **Dependencies**: No new dependencies required
- **Breaking Changes**: None
- **Migration Required**: None

### 📊 Impact
- **Better Debugging**: Detailed error logs with context
- **Improved Stability**: Better error handling and recovery
- **Enhanced Monitoring**: Connection status tracking
- **Security**: Environment validation prevents misconfigurations
- **Documentation**: Automated updates prevent outdated docs

---

## [2025-09-30] - Bug Fixes & UI Improvements

### 🐛 Bug Fixes
- **Fixed TypeError in Collection Stats**: Added `parseFloat()` conversion for database numeric values (total_paid_value, avg_paid_price)
  - PostgreSQL returns numeric as strings, causing `.toFixed()` to fail
  - Now properly converts to numbers before formatting
  
- **Fixed Image Placeholders**: Changed from broken `via.placeholder.com` to working `placehold.co` service
  - All placeholder images now load correctly
  - Consistent gray placeholder design
  
- **Fixed Navbar Overflow**: Improved navbar layout on collection page
  - Increased max-width from 1200px to 1400px
  - Added `white-space: nowrap` to prevent text wrapping
  - Reduced search input width from 280px to 240px
  - Added proper flex properties for better responsiveness
  - "My Collection" now displays fully without truncation

- **Fixed Rate Limiting Issues**: Adjusted overly restrictive rate limits causing 429 errors
  - Increased general request limit from 50 to 500 per 15 minutes
  - Increased auth endpoint limit from 5 to 50 per 15 minutes
  - Users can now register and login without hitting rate limits during testing
  - Fixed "Too many authentication attempts" error on first registration

- **Fixed Duplicate Checkbox**: Removed extra `<span class="checkmark">` causing visual issues in login form
  - Checkbox now displays correctly without gray overlay

### 🔧 Technical Details
- **Files Modified**:
  - `frontend/lego-collection.js` - Fixed parseFloat conversions, updated placeholder URLs
  - `frontend/brickeconomy.css` - Improved navbar layout and responsiveness
  - `frontend/index.html` - Removed duplicate checkbox span element
  - `backend/server.js` - Adjusted rate limiting configuration (500 general, 50 auth)
  - `backend/controllers/legoController.js` - Fixed `req.user.userId` (was `req.user.id`)

## [2025-09-30] - Authentication Modal & User Dropdown Implementation

### ✅ Added
- **Authentication Modal Integration**: Full login/registration modal on landing page
  - Modal opens on "Sign In or Up" button click
  - Clean, minimal input fields without distracting icons
  - Smooth animations with CSS transitions
  - Responsive design for mobile and desktop
  - ESC key support to close modal
  
- **User Dropdown Menu**: Dynamic navbar for authenticated users
  - Displays user avatar with initial
  - Shows username
  - Dropdown with Dashboard, Collection, and Logout options
  - Auto-detects login state on page load
  
- **Login State Management**: 
  - JWT token verification on page load
  - Automatic UI update based on authentication status
  - Shows "Sign In" button for guests
  - Shows user dropdown for logged-in users
  
- **Logout Functionality**:
  - Logout button in dropdown menu
  - Calls backend logout endpoint
  - Clears all authentication data
  - Reloads page to guest view

### 🎨 UI/UX Improvements
- **User Avatar**: Gradient background with user initial
- **Dropdown Animation**: Smooth fade-in/slide-down effect
- **Hover States**: Enhanced visual feedback on all interactive elements
- **Click Outside**: Dropdown closes when clicking outside
- **Responsive Navbar**: Works seamlessly on all screen sizes

### 🐛 Bug Fixes
- **Removed Distracting Icons**: Cleaned up login/register forms by removing unnecessary lock/envelope icons from inputs
- **Fixed Post-Login Redirect**: Changed redirect from `/dashboard.html` to `/home.html` for smoother user experience
- **Fixed Home Page Auth**: Removed forced authentication requirement from home.html - now works for both guests and logged-in users
- **Improved Input Styling**: Removed excessive left padding from form inputs after icon removal

### 🔧 Technical Details
- **Files Modified**:
  - `frontend/index.html` - Added user dropdown HTML structure, removed form icons
  - `frontend/script.js` - Added auth state detection, fixed redirect paths, user UI logic
  - `frontend/styles.css` - Removed duplicate modal CSS, added dropdown styles, fixed input padding
  - `frontend/home.js` - Made authentication optional instead of required
  
- **Authentication Flow**:
  1. Page loads → Check for `authToken` in localStorage
  2. If token exists → Verify with `/api/auth/profile`
  3. If valid → Show user dropdown with user data
  4. If invalid/missing → Show "Sign In" button
  5. On logout → Clear tokens + reload page

- **CSS Classes Added**:
  - `.user-dropdown` - Container for user menu
  - `.user-button` - Clickable user button
  - `.user-avatar` - Circular avatar with gradient
  - `.dropdown-menu` - Animated dropdown menu
  
- **Breaking Changes**: None
- **Migration Required**: None

## [2025-09-29] - Documentation & Error Handling Updates

### ✅ Added
- **Automatic Documentation Updates**: Script for maintaining up-to-date documentation
- **PostgreSQL Error Handling**: Specialized error codes handling in `errorHandler.js`
  - `23505` - unique_violation (duplicate entry)
  - `23503` - foreign_key_violation (referenced record not found)
  - `23502` - not_null_violation (required field missing)
  - `ECONNREFUSED` - database connection failed
  - `ENOTFOUND` - database host not found

- **Email Error Logging**: Enhanced logging in `emailService.js`
  - Structured logging with Winston
  - Detailed error context (email, messageId, errors)
  - Success/failure tracking

- **Database Pool Monitoring**: Event listeners in all models
  - Error logging with stack traces
  - Connection lifecycle tracking
  - Debug information for connection management

- **Redis Error Enhancement**: Improved error logging in `redisService.js`
  - Error codes in logs
  - Reconnection status tracking
  - Better error context

- **Environment Validation**: Startup validation in `server.js`
  - Required variables check (`JWT_SECRET`, `DATABASE_URL`)
  - Graceful failure with detailed error messages
  - Validation success logging

### 🔧 Technical Details
- **Files Modified**:
  - `backend/middleware/errorHandler.js`
  - `backend/utils/emailService.js`
  - `backend/utils/redisService.js`
  - `backend/server.js`
  - `backend/models/User.js`
  - `backend/models/LegoSet.js`
  - `backend/models/UserCollection.js`
  - `backend/models/OlxOffer.js`

- **Dependencies**: No new dependencies required
- **Breaking Changes**: None
- **Migration Required**: None

### 📊 Impact
- **Better Debugging**: Detailed error logs with context
- **Improved Stability**: Better error handling and recovery
- **Enhanced Monitoring**: Connection status tracking
- **Security**: Environment validation prevents misconfigurations
- **Documentation**: Automated updates prevent outdated docs

---

## [2025-09-29] - Documentation & Error Handling Updates

### ✅ Added
- **Automatic Documentation Updates**: Script for maintaining up-to-date documentation
- **PostgreSQL Error Handling**: Specialized error codes handling in `errorHandler.js`
  - `23505` - unique_violation (duplicate entry)
  - `23503` - foreign_key_violation (referenced record not found)
  - `23502` - not_null_violation (required field missing)
  - `ECONNREFUSED` - database connection failed
  - `ENOTFOUND` - database host not found

- **Email Error Logging**: Enhanced logging in `emailService.js`
  - Structured logging with Winston
  - Detailed error context (email, messageId, errors)
  - Success/failure tracking

- **Database Pool Monitoring**: Event listeners in all models
  - Error logging with stack traces
  - Connection lifecycle tracking
  - Debug information for connection management

- **Redis Error Enhancement**: Improved error logging in `redisService.js`
  - Error codes in logs
  - Reconnection status tracking
  - Better error context

- **Environment Validation**: Startup validation in `server.js`
  - Required variables check (`JWT_SECRET`, `DATABASE_URL`)
  - Graceful failure with detailed error messages
  - Validation success logging

### 🔧 Technical Details
- **Files Modified**:
  - `backend/middleware/errorHandler.js`
  - `backend/utils/emailService.js`
  - `backend/utils/redisService.js`
  - `backend/server.js`
  - `backend/models/User.js`
  - `backend/models/LegoSet.js`
  - `backend/models/UserCollection.js`
  - `backend/models/OlxOffer.js`

- **Dependencies**: No new dependencies required
- **Breaking Changes**: None
- **Migration Required**: None

### 📊 Impact
- **Better Debugging**: Detailed error logs with context
- **Improved Stability**: Better error handling and recovery
- **Enhanced Monitoring**: Connection status tracking
- **Security**: Environment validation prevents misconfigurations
- **Documentation**: Automated updates prevent outdated docs

---

## [2025-09-29] - Documentation & Error Handling Updates

### ✅ Added
- **Automatic Documentation Updates**: Script for maintaining up-to-date documentation
- **PostgreSQL Error Handling**: Specialized error codes handling in `errorHandler.js`
  - `23505` - unique_violation (duplicate entry)
  - `23503` - foreign_key_violation (referenced record not found)
  - `23502` - not_null_violation (required field missing)
  - `ECONNREFUSED` - database connection failed
  - `ENOTFOUND` - database host not found

- **Email Error Logging**: Enhanced logging in `emailService.js`
  - Structured logging with Winston
  - Detailed error context (email, messageId, errors)
  - Success/failure tracking

- **Database Pool Monitoring**: Event listeners in all models
  - Error logging with stack traces
  - Connection lifecycle tracking
  - Debug information for connection management

- **Redis Error Enhancement**: Improved error logging in `redisService.js`
  - Error codes in logs
  - Reconnection status tracking
  - Better error context

- **Environment Validation**: Startup validation in `server.js`
  - Required variables check (`JWT_SECRET`, `DATABASE_URL`)
  - Graceful failure with detailed error messages
  - Validation success logging

### 🔧 Technical Details
- **Files Modified**:
  - `backend/middleware/errorHandler.js`
  - `backend/utils/emailService.js`
  - `backend/utils/redisService.js`
  - `backend/server.js`
  - `backend/models/User.js`
  - `backend/models/LegoSet.js`
  - `backend/models/UserCollection.js`
  - `backend/models/OlxOffer.js`

- **Dependencies**: No new dependencies required
- **Breaking Changes**: None
- **Migration Required**: None

### 📊 Impact
- **Better Debugging**: Detailed error logs with context
- **Improved Stability**: Better error handling and recovery
- **Enhanced Monitoring**: Connection status tracking
- **Security**: Environment validation prevents misconfigurations
- **Documentation**: Automated updates prevent outdated docs

---

## [2025-01-XX] - Error Handling & Logging Improvements

### ✅ Added
- **PostgreSQL Error Handling**: Specialized error codes handling in `errorHandler.js`
  - `23505` - unique_violation (duplicate entry)
  - `23503` - foreign_key_violation (referenced record not found)
  - `23502` - not_null_violation (required field missing)
  - `ECONNREFUSED` - database connection failed
  - `ENOTFOUND` - database host not found

- **Email Error Logging**: Enhanced logging in `emailService.js`
  - Structured logging with Winston
  - Detailed error context (email, messageId, errors)
  - Success/failure tracking

- **Database Pool Monitoring**: Event listeners in all models
  - Error logging with stack traces
  - Connection lifecycle tracking
  - Debug information for connection management

- **Redis Error Enhancement**: Improved error logging in `redisService.js`
  - Error codes in logs
  - Reconnection status tracking
  - Better error context

- **Environment Validation**: Startup validation in `server.js`
  - Required variables check (`JWT_SECRET`, `DATABASE_URL`)
  - Graceful failure with detailed error messages
  - Validation success logging

### 🔧 Technical Details
- **Files Modified**:
  - `backend/middleware/errorHandler.js`
  - `backend/utils/emailService.js`
  - `backend/utils/redisService.js`
  - `backend/server.js`
  - `backend/models/User.js`
  - `backend/models/LegoSet.js`
  - `backend/models/UserCollection.js`
  - `backend/models/OlxOffer.js`

- **Dependencies**: No new dependencies required
- **Breaking Changes**: None
- **Migration Required**: None

### 📊 Impact
- **Better Debugging**: Detailed error logs with context
- **Improved Stability**: Better error handling and recovery
- **Enhanced Monitoring**: Connection status tracking
- **Security**: Environment validation prevents misconfigurations

---

## Previous Versions

### [1.0.0] - Initial Release
- ✅ Complete LEGO collection management system
- ✅ User authentication with JWT
- ✅ PostgreSQL database with 1000+ LEGO sets
- ✅ Redis caching and session management
- ✅ Email service for notifications
- ✅ Docker containerization
- ✅ Security middleware (Helmet, CORS, rate limiting)
- ✅ Structured logging and monitoring
- ✅ Responsive frontend interface
- ✅ OLX marketplace integration
- ✅ Price comparison features

---

## Legend
- ✅ **Added** - New features
- 🔧 **Changed** - Changes to existing functionality  
- 🐛 **Fixed** - Bug fixes
- ⚠️ **Deprecated** - Features marked for removal
- ❌ **Removed** - Removed features
- 🔒 **Security** - Security-related changes
- 📊 **Performance** - Performance improvements
