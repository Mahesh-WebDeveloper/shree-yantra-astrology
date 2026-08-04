@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Shree Yantra - USB Live Preview
color 0A

set "ROOT=%~dp0"
set "MOBILE=%ROOT%mobile"
set "ANDROID_HOME=A:\android-build\android-sdk"
set "PATH=%ANDROID_HOME%\platform-tools;%PATH%"
set "EXPO_PUBLIC_API_URL=http://127.0.0.1:4000"
set "REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1"

echo.
echo ============================================================
echo   SHREE YANTRA - USB LIVE PREVIEW
echo ============================================================
echo.

if not exist "%MOBILE%\package.json" (
  echo [ERROR] Mobile project was not found: %MOBILE%
  goto :fail
)

echo [1/5] Checking one authorized Android phone...
adb start-server >nul 2>&1
set "DEVICE_COUNT=0"
for /f "skip=1 tokens=1,2" %%A in ('adb devices') do (
  if "%%B"=="device" set /a DEVICE_COUNT+=1
)
if not "!DEVICE_COUNT!"=="1" (
  echo [ERROR] Connect exactly one phone and allow USB debugging.
  echo.
  adb devices
  goto :fail
)

echo [2/5] Checking local backend on port 4000...
powershell.exe -NoProfile -Command "try { $r=Invoke-WebRequest -Uri 'http://127.0.0.1:4000/api/health' -UseBasicParsing -TimeoutSec 5; if ($r.StatusCode -ne 200) { exit 1 } } catch { exit 1 }"
if errorlevel 1 (
  echo [ERROR] Local backend is not running.
  echo Start it in another CMD with:
  echo cd /d "%ROOT%backend"
  echo npm run dev
  goto :fail
)

echo [3/5] Creating USB tunnels for Metro and backend...
adb reverse tcp:8081 tcp:8081
if errorlevel 1 goto :fail
adb reverse tcp:4000 tcp:4000
if errorlevel 1 goto :fail

echo [4/5] Preparing Metro port 8081...
powershell.exe -NoProfile -Command "$c=Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; if ($c) { $p=Get-CimInstance Win32_Process -Filter ('ProcessId=' + $c.OwningProcess); if ($p.CommandLine -like '*expo*start*') { Stop-Process -Id $c.OwningProcess -Force; Start-Sleep -Seconds 2 } else { Write-Error ('Port 8081 is used by: ' + $p.CommandLine); exit 2 } }"
if errorlevel 1 (
  echo [ERROR] Port 8081 could not be prepared safely.
  goto :fail
)

echo [5/5] Starting Metro and opening the development app...
start "" /b cmd.exe /d /c "timeout /t 8 /nobreak >nul ^& adb shell am force-stop com.shreeyantra.astrology ^& adb shell am start -a android.intent.action.VIEW -d shreeyantra://expo-development-client/?url=http%%3A%%2F%%2F127.0.0.1%%3A8081"

echo.
echo Keep this window and the USB cable connected.
echo Save files in mobile\src to see Fast Refresh on the phone.
echo Press Ctrl+C when you want to stop Metro.
echo.

pushd "%MOBILE%"
call npx expo start --dev-client --lan --port 8081
set "METRO_EXIT=!ERRORLEVEL!"
popd
exit /b !METRO_EXIT!

:fail
echo.
echo USB live preview could not start.
echo.
pause
exit /b 1
