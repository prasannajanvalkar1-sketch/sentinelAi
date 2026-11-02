param (
    [string]$Username = $env:USERNAME,
    [string]$BackendUrl = "https://sentinelai-backend-33dw.onrender.com/api/telemetry/ingest/",
    [string]$ApiKey = "sk_sentinel_live_938aB"
)

# Set Console Title & Encoding
$host.UI.RawUI.WindowTitle = "SentinelAI - USB Live Detection Watchdog"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "      SENTINEL AI - REAL-TIME HARDWARE USB WATCHDOG" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "[*] Trainee / Client Machine User: '$Username'" -ForegroundColor Yellow
Write-Host "[*] Target SOC Cloud Ingest:       $BackendUrl" -ForegroundColor Gray

# Take initial snapshot of existing drive letters (e.g. C:\, D:\)
$baseline = [System.IO.DriveInfo]::GetDrives() | Where-Object { $_.IsReady } | Select-Object -ExpandProperty Name
Write-Host "[*] Currently connected drives:    $($baseline -join ', ')" -ForegroundColor Yellow
Write-Host ""
Write-Host ">>> NOW PLUG IN ANY PHYSICAL USB FLASH DRIVE INTO THIS LAPTOP! <<<" -ForegroundColor Green
Write-Host "[*] Listening for hardware arrival (Press Ctrl+C to stop)..." -ForegroundColor White
Write-Host "----------------------------------------------------------------" -ForegroundColor Gray

while ($true) {
    Start-Sleep -Milliseconds 600
    try {
        $currentDrives = [System.IO.DriveInfo]::GetDrives() | Where-Object { $_.IsReady }
        $currentNames = $currentDrives | Select-Object -ExpandProperty Name

        # Check for new drive arrival
        foreach ($drive in $currentDrives) {
            if ($baseline -notcontains $drive.Name) {
                $driveLetter = $drive.Name
                $label = if ($drive.VolumeLabel) { $drive.VolumeLabel } else { "Removable USB Drive" }
                $driveType = $drive.DriveType.ToString()

                Write-Host ""
                Write-Host "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" -ForegroundColor Red
                Write-Host "  [ALERT] PHYSICAL USB DRIVE INSERTED: $driveLetter [$label]" -ForegroundColor Red
                Write-Host "  Drive Type: $driveType | Timestamp: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Red
                Write-Host "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" -ForegroundColor Red
                Write-Host "[*] Transmitting real-time security alert to Admin SOC Cloud..." -ForegroundColor Yellow

                $payload = @{
                    username     = $Username
                    student_name = $Username
                    event        = "SECURITY_ALERT"
                    alert_type   = "USB_DETECTED"
                    details      = "Unauthorized Physical USB Drive Plugged In: $driveLetter ($label)"
                    severity     = "CRITICAL"
                } | ConvertTo-Json

                $headers = @{
                    "Content-Type"       = "application/json"
                    "X-Sentinel-API-Key" = $ApiKey
                }

                try {
                    $response = Invoke-RestMethod -Uri $BackendUrl -Method Post -Headers $headers -Body $payload -TimeoutSec 10
                    Write-Host "[+] SUCCESS! Alert Delivered to Admin SOC Dashboard in Real Time!" -ForegroundColor Green
                    Write-Host "    Incident ID: $($response.event_id) | Trainee: $Username" -ForegroundColor Green
                } catch {
                    Write-Host "[!] Transmission warning: $_" -ForegroundColor DarkYellow
                }
                Write-Host ""
            }
        }

        # Check for removals
        foreach ($b in $baseline) {
            if ($currentNames -notcontains $b) {
                Write-Host "[*] Drive removed: $b. Ready for next insertion..." -ForegroundColor Gray
            }
        }

        $baseline = $currentNames
    } catch {
        # Silent loop catch
    }
}
