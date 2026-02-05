
# Panduan Deployment: workflow.solusidigitalcreative.com

## Prasyarat di VPS
1.  **Docker & Docker Compose** sudah terinstall.
2.  **Git** sudah terinstall.
3.  **Nginx** (atau web server lain) sudah terinstall sebagai reverse proxy.

## 1. Instalasi di VPS (via SCP)

1.  **Persiapkan File Lokal**:
    Di komputer Windows Anda, jalankan script PowerShell berikut (gunakan `-ExecutionPolicy Bypass` jika script dilarang):
    ```powershell
    powershell -ExecutionPolicy Bypass -File .\prepare-deploy.ps1
    ```
    Script ini akan membuat file `deploy.zip` di root folder project Anda.

2.  **Upload ke VPS**:
    Gunakan SCP untuk mengupload file zip ke server. Ganti `user` dan `ip-vps-anda` dengan detail yang sesuai.
    ```powershell
    scp deploy.zip user@ip-vps-anda:/tmp/deploy.zip
    ```

3.  **Setup Direktori di VPS**:
    SSH ke VPS Anda dan jalankan perintah berikut:
    ```bash
    # Buat direktori aplikasi
    sudo mkdir -p /var/www/workflow
    sudo chown -R $USER:$USER /var/www/workflow
    
    # Pindahkan dan ekstrak file
    mv /tmp/deploy.zip /var/www/workflow/
    cd /var/www/workflow
    unzip -o deploy.zip
    rm deploy.zip
    ```

4.  **Buat File Environment (.env)**:
    Buat file `.env` di dalam direktori aplikasi:
    ```bash
    nano .env
    ```
    Isi dengan konfigurasi berikut:
    ```env
    GOOGLE_API_KEY=api_key_gemini_anda
    JWT_SECRET=rahasia_jwt_super_aman_anda
    CRON_SECRET=token_rahasia_bebas
    # DATABASE_URL sudah diset otomatis di docker-compose.yml ke file:/app/prisma/prod.db
    ```

5.  **Jalankan Aplikasi**:
    ```bash
    docker-compose up -d --build
    ```

## 2. Konfigurasi Nginx (Reverse Proxy)

Buat file konfigurasi Nginx baru:
```bash
sudo nano /etc/nginx/sites-available/workflow.solusidigitalcreative.com
```

Paste konfigurasi berikut:

```nginx
server {
    server_name workflow.solusidigitalcreative.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Naikkan batas ukuran upload jika perlu (untuk gambar)
        client_max_body_size 10M;
    }

    # Konfigurasi SSL akan ditambahkan otomatis oleh Certbot nanti
    listen 80;
}
```

Aktifkan konfigurasi site tersebut:
```bash
sudo ln -s /etc/nginx/sites-available/workflow.solusidigitalcreative.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 3. Setup SSL (HTTPS) dengan Certbot

Jalankan Certbot untuk mengamankan domain dengan SSL gratis Let's Encrypt:
```bash
sudo certbot --nginx -d workflow.solusidigitalcreative.com
```

## 4. Pemeliharaan (Maintenance)

- **Update Aplikasi (via SCP)**:
    1.  Lakukan perubahan kode di komputer lokal, lalu jalankan `.\prepare-deploy.ps1`.
    2.  Upload ulang file zip: `scp deploy.zip user@ip-vps-anda:/var/www/workflow/deploy.zip`.
    3.  Di VPS, jalankan:
        ```bash
        cd /var/www/workflow
        unzip -o deploy.zip
        rm deploy.zip
        docker-compose up -d --build
        ```
- **Lihat Logs**:
    ```bash
    docker logs -f workflow_app
    ```
- **Backup Database**:
    Copy file `prisma/prod.db` ke lokasi aman secara berkala.

## 5. Setup Cron Job (Penting)

Agar pipeline otomatis berjalan, Anda perlu memicu endpoint cron secara berkala. Karena aplikasi memiliki API route bawaan untuk cron, gunakan `curl` di crontab host.

Edit crontab:
```bash
crontab -e
```

Tambahkan baris ini (contoh: jalan setiap jam):
```bash
0 * * * * curl -X GET http://localhost:3010/api/cron
```
