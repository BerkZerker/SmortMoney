# PowerShell script to start the SmortMoney application

Write-Host "Starting SmortMoney Application..."

# Define base path (assuming script is run from project root)
$basePath = $PSScriptRoot

# 1. Compile Backend TypeScript
Write-Host "Compiling backend TypeScript..."
Push-Location "$basePath\SmortMoneyBackend"
npx tsc
if ($LASTEXITCODE -ne 0) {
    Write-Error "Backend compilation failed. Exiting."
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "Backend compiled successfully."

# 2. Start Backend Server in a new window
Write-Host "Starting backend server (Node.js) in a new window..."
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting Backend...'; cd '$basePath\SmortMoneyBackend'; node dist/index.js; Write-Host 'Backend process finished.' -ForegroundColor Yellow"

# 3. Start Frontend Server (Expo) in a new window
Write-Host "Starting frontend server (Expo) in a new window..."
# Using --web flag to directly target web build
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting Frontend...'; cd '$basePath\SmortMoneyApp'; npx expo start --web; Write-Host 'Frontend process finished.' -ForegroundColor Yellow"

# 4. Wait for servers to initialize (adjust sleep time if needed)
Write-Host "Waiting for servers to initialize (15 seconds)..."
Start-Sleep -Seconds 15

# 5. Open Frontend URL in default browser
Write-Host "Opening application in browser (http://localhost:8081)..."
Start-Process "http://localhost:8081"

Write-Host "SmortMoney application startup initiated."
Write-Host "Check the new terminal windows for server logs."
