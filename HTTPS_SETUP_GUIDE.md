# 🔒 HTTPS/SSL Setup Guide

## ⚠️ WAŻNE: Aplikacja wymaga HTTPS w produkcji!

### 🔧 Opcje konfiguracji HTTPS:

#### 1. **Nginx + Let's Encrypt (RECOMMENDED)**
```bash
# Instalacja Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Generowanie certyfikatu
sudo certbot --nginx -d yourdomain.com

# Automatyczne odnawianie
sudo crontab -e
# Dodaj: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### 2. **Cloudflare (Najłatwiejsze)**
1. Dodaj domenę do Cloudflare
2. Ustaw DNS na Cloudflare
3. Włącz "Full (strict)" SSL/TLS
4. Włącz "Always Use HTTPS"

#### 3. **Docker + Traefik (Dla kontenerów)**
```yaml
# docker-compose.yml
version: '3.8'
services:
  traefik:
    image: traefik:v2.10
    command:
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=your-email@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt
```

### 🔧 Aktualizacja nginx.conf dla HTTPS:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Reszta konfiguracji...
}
```

### ⚠️ WYMAGANE ZMIANY:
1. **Frontend URL** - zmień na `https://yourdomain.com`
2. **CORS origins** - dodaj HTTPS domeny
3. **HSTS** - już skonfigurowany w nginx.conf
4. **Redirect HTTP → HTTPS** - dodaj w nginx

---
**Status: ⚠️ WYMAGA KONFIGURACJI HTTPS DLA PRODUKCJI**
