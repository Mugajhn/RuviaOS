@echo off
title RuviaOS USB Backup Tool
color 0A

echo ========================================
echo    RuviaOS USB Backup Tool
echo ========================================
echo.

REM Change to the script directory
cd /d "%~dp0"

REM Ask for USB drive letter
echo Available drives:
wmic logicaldisk where drivetype=2 get deviceid, volumename, size
echo.
set /p USB_DRIVE="Enter your USB drive letter (e.g., D): "

REM Add colon to drive letter
set USB_DRIVE=%USB_DRIVE%:\

echo.
echo Checking for USB drive...
if exist %USB_DRIVE% (
    echo USB drive found: %USB_DRIVE%
) else (
    echo USB drive not found at %USB_DRIVE%
    echo Please insert USB drive and try again
    pause
    exit /b
)

echo.
echo Creating backup folder on USB drive...
if not exist %USB_DRIVE%RuviaOS_Backups mkdir %USB_DRIVE%RuviaOS_Backups

echo.
echo Starting database backup...
echo This may take a few minutes...

REM Create backups folder if it doesn't exist
if not exist "%~dp0backups" mkdir "%~dp0backups"

REM Run the backup using pg_dump
set PGPASSWORD=postgres

for /f "tokens=1-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (set mytime=%%a-%%b)
set BACKUP_NAME=ruviaos_backup_%mydate%_%mytime%

echo Creating backup: %BACKUP_NAME%

pg_dump -h localhost -p 5432 -U postgres -d ruvia_hotel_db -f "%BACKUP_NAME%.sql"

if errorlevel 1 (
    echo Backup failed!
    pause
    exit /b
)

echo SQL backup created, compressing...

REM Create zip using PowerShell
powershell Compress-Archive -Path "%BACKUP_NAME%.sql" -DestinationPath "%BACKUP_NAME%.zip" -Force

REM Delete the SQL file
del "%BACKUP_NAME%.sql"

REM Move zip to backups folder
move "%BACKUP_NAME%.zip" "%~dp0backups\" > nul

echo.
echo Copying latest backup to USB drive...
copy "%~dp0backups\%BACKUP_NAME%.zip" "%USB_DRIVE%RuviaOS_Backups\" > nul

echo.
echo ========================================
echo    Backup Complete!
echo    Saved to: %USB_DRIVE%RuviaOS_Backups\%BACKUP_NAME%.zip
echo    Also saved locally: %~dp0backups\%BACKUP_NAME%.zip
echo ========================================
echo.

REM Show backup size
for %%A in ("%~dp0backups\%BACKUP_NAME%.zip") do echo Backup size: %%~zA bytes

echo.
echo Press any key to exit...
pause > nul