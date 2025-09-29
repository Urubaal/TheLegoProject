# 🚀 Deployment Guide

Przewodnik wdrażania systemu logowania na różnych platformach.

## 📋 Przed wdrożeniem

1. **Skonfiguruj zmienne środowiskowe**
2. **Przetestuj lokalnie**
3. **Przygotuj domenę i SSL**
4. **Skonfiguruj bazę danych** (opcjonalnie)

## 🌐 Frontend Deployment

### GitHub Pages
1. Przejdź do Settings → Pages
2. Wybierz source: Deploy from a branch
3. Wybierz branch: main
4. Folder: / (root)
5. Zapisz i poczekaj na deployment

### Netlify
1. Połącz repozytorium GitHub
2. Ustaw build command: `echo "Static site"`
3. Ustaw publish directory: `frontend/`
4. Dodaj environment variables jeśli potrzebne

### Vercel
1. Importuj projekt z GitHub
2. Ustaw root directory: `frontend/`
3. Deploy

## 🔧 Backend Deployment

### Heroku
1. Zainstaluj Heroku CLI
2. Utwórz aplikację:
   ```bash
   heroku create your-app-name
   ```
3. Dodaj zmienne środowiskowe:
   ```bash
   heroku config:set JWT_SECRET=your-secret
   heroku config:set EMAIL_USER=your-email
   heroku config:set EMAIL_PASS=your-password
   ```
4. Wypchnij kod:
   ```bash
   git subtree push --prefix=backend heroku main
   ```

### Railway
1. Połącz repozytorium GitHub
2. Wybierz folder: `backend/`
3. Dodaj environment variables
4. Deploy

### DigitalOcean App Platform
1. Połącz GitHub repository
2. Wybierz backend folder
3. Ustaw build command: `npm install`
4. Ustaw run command: `npm start`
5. Dodaj environment variables

### VPS (Ubuntu/CentOS)
1. Zainstaluj Node.js i PM2
2. Sklonuj repozytorium
3. Zainstaluj zależności:
   ```bash
   cd backend
   npm install --production
   ```
4. Uruchom z PM2:
   ```bash
   pm2 start server.js --name auth-backend
   pm2 save
   pm2 startup
   ```

## 🐳 Docker Deployment

### Dockerfile dla Backend
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .
EXPOSE 3000
CMD ["npm", "start"]
```

### Dockerfile dla Frontend
```dockerfile
FROM nginx:alpine
COPY frontend/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your-secret
    volumes:
      - ./backend:/app
      
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

## 🔒 SSL/HTTPS

### Let's Encrypt (Certbot)
```bash
sudo certbot --nginx -d yourdomain.com
```

### Cloudflare
1. Dodaj domenę do Cloudflare
2. Włącz SSL/TLS
3. Ustaw Full (strict) mode

## 📊 Monitoring

### PM2 Monitoring
```bash
pm2 monit
pm2 logs
```

### Health Check
Backend ma endpoint: `GET /api/health`

## 🔄 CI/CD

### GitHub Actions
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "your-app-name"
          heroku_email: "your-email@example.com"
```

## 🗄️ Database Setup

### MongoDB Atlas
1. Utwórz cluster na MongoDB Atlas
2. Skonfiguruj connection string
3. Dodaj do environment variables

### PostgreSQL (Heroku)
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

## 📝 Environment Variables

### Production
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=super-secure-secret-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=CHANGE_ME_EMAIL_PASSWORD
FRONTEND_URL=https://yourdomain.com
```

## 🚨 Troubleshooting

### Common Issues
1. **CORS errors** - Sprawdź FRONTEND_URL
2. **Email not sending** - Sprawdź SMTP credentials
3. **JWT errors** - Sprawdź JWT_SECRET
4. **Port conflicts** - Sprawdź czy port jest wolny

### Logs
```bash
# Heroku
heroku logs --tail

# PM2
pm2 logs

# Docker
docker logs container-name
```

## 📈 Performance

### Backend Optimization
- Użyj PM2 cluster mode
- Skonfiguruj Redis dla sesji
- Dodaj rate limiting
- Użyj CDN dla statycznych plików

### Frontend Optimization
- Minify CSS/JS
- Użyj CDN
- Włącz gzip compression
- Optymalizuj obrazy

## 🔐 Security Checklist

- [ ] HTTPS enabled
- [ ] JWT secret is strong
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] Environment variables secured
- [ ] Database credentials secured
- [ ] Regular security updates
