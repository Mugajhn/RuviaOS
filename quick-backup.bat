@echo off
color 0A
echo ========================================
echo    RuviaOS Quick Backup
echo ========================================
echo.

cd /d "%~dp0"

if not exist "%~dp0backups" mkdir "%~dp0backups"

set PGPASSWORD=Kawasiima
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (set mytime=%%a-%%b)
set BACKUP_NAME=ruviaos_backup_%mydate%_%mytime%

echo Creating backup: %BACKUP_NAME%

REM === THIS IS THE IMPORTANT LINE WITH FULL PATH ===
"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -h localhost -p 5432 -U postgres -d ruvia_hotel_db -f "%BACKUP_NAME%.sql"

if errorlevel 1 (
    echo Backup failed!
    echo Make sure PostgreSQL is running and password is correct
    pause
    exit /b
)

echo SQL backup created, compressing...

powershell Compress-Archive -Path "%BACKUP_NAME%.sql" -DestinationPath "%BACKUP_NAME%.zip" -Force
del "%BACKUP_NAME%.sql"
move "%BACKUP_NAME%.zip" "%~dp0backups\" > nul

echo.
echo ========================================
echo    Backup Complete!
echo    Saved to: %~dp0backups\%BACKUP_NAME%.zip
echo ========================================
echo.

for %%A in ("%~dp0backups\%BACKUP_NAME%.zip") do echo Backup size: %%~zA bytes

echo.
pause