#!/bin/bash

echo "=== AutoNews Maintenance ==="
echo "Date: $(date)"

# 1. Clean Docker System (Unused images, build cache)
# -a: Remove all unused images not just dangling ones
# -f: Force (no confirmation)
echo "Cleaning Docker system..."
docker system prune -a -f --volumes

# 2. Rotate Logs (Docker usually handles this if configured, but good to check)
echo "Docker logs are managed by max-size policy."

# 3. Optional: Clean old images from public folder (older than 30 days)
# Uncomment if you want to enable this
# find ./public/images -type f -mtime +30 -name "*.jpg" -delete

echo "Maintenance Complete!"
echo "Disk Usage:"
df -h /
