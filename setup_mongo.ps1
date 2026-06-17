$ErrorActionPreference = "Stop"

Write-Host "1. Downloading MongoDB Portable (using fast curl)..."
$url = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.14.zip"
$output = "mongodb-portable.zip"
curl.exe -L -o $output $url

Write-Host "2. Extracting MongoDB..."
Expand-Archive -Path $output -DestinationPath "mongodb-portable" -Force

Write-Host "3. Creating database storage folder..."
New-Item -ItemType Directory -Force -Path "mongodb-portable\data\db" | Out-Null

Write-Host "4. Cleaning up zip file..."
Remove-Item $output -Force

Write-Host "5. Launching MongoDB Server in the background..."
$mongodPath = (Get-ChildItem -Path "mongodb-portable" -Filter "mongod.exe" -Recurse).FullName
$dbPath = "$PWD\mongodb-portable\data\db"

Start-Process -FilePath $mongodPath -ArgumentList "--dbpath `"$dbPath`"" -WindowStyle Minimized

Write-Host "=========================================================="
Write-Host "✅ MongoDB is now running locally!"
Write-Host "It is running in a minimized background window."
Write-Host "=========================================================="
