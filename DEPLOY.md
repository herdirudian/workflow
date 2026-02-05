
# Panduan Deployment: workflow.solusidigitalcreative.com

## Prasyarat di VPS
1.  **Docker & Docker Compose** sudah terinstall.
    *(Jika belum, jalankan perintah ini)*:
    ```bash
    sudo apt update
    sudo apt install docker.io docker-compose-v2 -y
    sudo systemctl start docker
    sudo systemctl enable docker
    ```
2.  **Git** sudah terinstall.
    ```bash
    sudo apt install git -y
    ```
3.  **Nginx** (atau web server lain) sudah terinstall sebagai reverse proxy.


## 1. Instalasi di VPS (via GitHub)

1.  **Clone Repository**:
    Masuk ke VPS Anda dan clone repository dari GitHub:
    ```bash
    # Buat direktori (opsional, bisa langsung clone)
    cd /var/www
    
    # Clone repo
    git clone https://github.com/herdirudian/workflow.git
    cd workflow
    ```

2.  **Buat File Environment (.env)**:
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

3.  **Persiapkan File Database (PENTING)**:
    Docker akan membuat folder, bukan file, jika file database belum ada. Lakukan ini untuk mencegah error:
    ```bash
    # Pastikan file database ada dan kosong
    touch prisma/prod.db
    ```

4.  **Jalankan Aplikasi**:
    ```bash
    docker-compose up -d --build
    ```

## 2. Konfigurasi Nginx (Reverse Proxy)

Buat file konfigurasi Nginx baru:
```bash
sudo nano /etc/nginx/sites-available/workflow.solusidigitalcreative.com
```

Paste konfigurasi berikut (pastikan hanya menyalin isi di dalam blok kode, jangan sertakan ```nginx):

```nginx
server {
    server_name workflow.solusidigitalcreative.com;

    location / {
        proxy_pass http://localhost:3010;
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

- **Update Aplikasi (via GitHub)**:
    1.  Lakukan perubahan kode di komputer lokal, commit, dan push ke GitHub.
    2.  Di VPS, jalankan:
        ```bash
        cd /var/www/workflow
        git pull origin master
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
