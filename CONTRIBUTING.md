# Contributing to TheLegoProject

Thank you for your interest in the project! Here's how you can contribute to the development of the authentication system.

## 🚀 Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/TheLegoProject.git
   cd TheLegoProject
   ```
3. **Create branch** for your feature:
   ```bash
   git checkout -b feature/feature-name
   ```

## 📝 Development Process

### Backend
1. Go to `backend/` folder
2. Install dependencies: `npm install`
3. Copy `env.example` to `.env` and configure
4. Run server: `npm run dev`

### Frontend
1. Open `frontend/index.html` in browser
2. Or run local HTTP server

## 🧪 Testing

Before submitting Pull Request:

1. **Backend:**
   ```bash
   cd backend
   npm test
   ```

2. **Frontend:**
   - Test all forms
   - Check responsiveness
   - Test on different browsers

## 📋 Guidelines

### Code
- Use **English comments** in code
- **Polish** variable and function names are OK
- Follow existing code style
- Add tests for new features

### Commits
- Use conventions: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`
- Examples:
  - `feat: add user registration endpoint`
  - `fix: resolve password validation bug`
  - `docs: update API documentation`

### Pull Requests
1. Describe what the PR does
2. List changes
3. Add screenshots if UI related
4. Make sure code compiles

## 🐛 Bug Reports

Use Issue template:
- **Problem description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Environment** (OS, browser, Node.js version)

## ✨ Feature Requests

Before implementation:
1. Check if similar Issue already exists
2. Describe feature in detail
3. Explain benefits
4. Consider impact on existing code

## 📞 Help

- Open Issue with question
- Check documentation in README.md
- Review existing Issues

## 🎯 Development Areas

- [ ] Add database (MongoDB/PostgreSQL)
- [ ] Unit and integration tests
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Add 2FA
- [ ] Social login (Google, Facebook)
- [ ] User dashboard
- [ ] Admin panel

Thank you for contributing to the project! 🎉
