
$ErrorActionPreference = "Stop"

$tempDir = "deploy_temp"
$zipFile = "deploy.zip"

Write-Host "Preparing deployment..."

# 1. Clean up previous run
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
if (Test-Path $zipFile) { Remove-Item $zipFile -Force }

# 2. Create temp directory
New-Item -ItemType Directory -Path $tempDir | Out-Null

# 3. Copy files (excluding heavy/unnecessary folders)
$items = Get-ChildItem -Path .
foreach ($item in $items) {
    # Skip these top-level folders/files
    if ($item.Name -in "node_modules", ".next", ".git", ".vscode", ".trae", "deploy.zip", $tempDir) {
        continue
    }

    Write-Host "Copying $($item.Name)..."
    Copy-Item -Path $item.FullName -Destination "$tempDir\$($item.Name)" -Recurse -Force
}

# 4. Remove specific internal files we don't want in production
$filesToRemove = @(
    "$tempDir\prisma\dev.db",
    "$tempDir\*.log"
)

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Write-Host "Removing excluded file: $file"
        Remove-Item $file -Force
    }
}

# 5. Zip using tar (more robust than Compress-Archive)
Write-Host "Zipping files..."

# We need to change directory to zip contents without the temp folder name
$currentDir = Get-Location
Set-Location $tempDir
try {
    # -a auto-detects compression (zip) based on extension
    # -c create
    # -f file
    tar -a -c -f "$currentDir\$zipFile" *
}
finally {
    Set-Location $currentDir
}

# 6. Cleanup
Remove-Item $tempDir -Recurse -Force

Write-Host "Success! Created $zipFile"
Write-Host "Use this command to run the script next time:"
Write-Host "powershell -ExecutionPolicy Bypass -File .\prepare-deploy.ps1"
