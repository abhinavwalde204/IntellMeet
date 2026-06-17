$mongodPath = (Get-ChildItem -Path "mongodb-portable" -Filter "mongod.exe" -Recurse -ErrorAction SilentlyContinue).FullName
$dbPath = "$PWD\mongodb-portable\data\db"

if (-not $mongodPath) {
    Write-Host "❌ could not find mongod.exe inside mongodb-portable folder."
    Write-Host "Please run setup_mongo.ps1 first to download it."
    exit 1
}

Write-Host "Starting MongoDB Portable..."
Start-Process -FilePath $mongodPath -ArgumentList "--dbpath `"$dbPath`"" -WindowStyle Minimized
Write-Host "✅ MongoDB started successfully in a minimized window!"
