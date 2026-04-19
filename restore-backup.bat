@echo off
color 0C
echo ========================================
echo    RuviaOS Restore Tool
echo ========================================
echo WARNING: This will replace ALL current data!
echo.

cd /d "%~dp0"

echo Available backups:
echo.
dir "%~dp0backups\*.zip" /b

echo.
set /p BACKUP_FILE="Enter backup filename to restore (e.g., ruviaos_backup_2025-04-11_10-30.zip): "

if not exist "%~dp0backups\%BACKUP_FILE%" (
    echo File not found!
    pause
    exit /b
)

echo.
set /p CONFIRM="WARNING: This will DELETE all current data. Type 'RESTORE' to continue: "

if not "%CONFIRM%"=="RESTORE" (
    echo Restore cancelled.
    pause
    exit /b
)

echo.
echo Extracting backup...

REM Create temp folder
if not exist "%~dp0temp_restore" mkdir "%~dp0temp_restore"

REM Extract zip
powershell Expand-Archive -Path "%~dp0backups\%BACKUP_FILE%" -DestinationPath "%~dp0temp_restore" -Force

REM Find the SQL file
for %%f in ("%~dp0temp_restore\*.sql") do set SQL_FILE=%%f

if "%SQL_FILE%"=="" (
    echo No SQL file found in backup!
    pause
    exit /b
)

echo Restoring database...
set PGPASSWORD=postgres
psql -h localhost -p 5432 -U postgres -d ruvia_hotel_db -f "%SQL_FILE%"

if errorlevel 1 (
    echo Restore failed!
) else (
    echo Restore completed successfully!
)

REM Clean up
rmdir /s /q "%~dp0temp_restore"

echo.
pause