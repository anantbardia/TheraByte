$backendProcess = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\activate; uvicorn main:app --reload --port 8000" -PassThru
Write-Host "Backend started with ID: $($backendProcess.Id)"

$frontendProcess = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -PassThru
Write-Host "Frontend started with ID: $($frontendProcess.Id)"

Write-Host "Both services are starting..."
Write-Host "Backend: http://localhost:8000"
Write-Host "Frontend: http://localhost:5173"
