@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Shree Yantra - Build and Install Development Client
color 0B

set "ROOT=%~dp0"
set "BUILD=C:\m"
set "OUTPUT_DIR=A:\android-build"
set "DEV_APK=%BUILD%\android\app\build\outputs\apk\debug\app-debug.apk"
set "FINAL_APK=%OUTPUT_DIR%\shree-yantra-development-client.apk"
set "JAVA_HOME=A:\android-build\jdk17\jdk-17.0.19+10"
set "ANDROID_HOME=A:\android-build\android-sdk"
set "NODE_ENV=development"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"
set "NONINTERACTIVE=0"
if /I "%~1"=="--non-interactive" set "NONINTERACTIVE=1"

echo.
echo ============================================================
echo   SHREE YANTRA - DEVELOPMENT CLIENT BUILDER
echo ============================================================
echo   Build path: C:\m (avoids Windows 260-character CMake limit)
echo.

if not exist "%ROOT%BUILD_LATEST_APK.bat" (
  echo [ERROR] BUILD_LATEST_APK.bat was not found.
  goto :fail
)

echo [1/6] Synchronizing latest mobile code to C:\m...
call "%ROOT%BUILD_LATEST_APK.bat" --sync-only --non-interactive
if errorlevel 1 goto :fail

echo [2/6] Checking the connected Android phone...
adb start-server >nul 2>&1
set "DEVICE_COUNT=0"
for /f "skip=1 tokens=1,2" %%A in ('adb devices') do (
  if "%%B"=="device" set /a DEVICE_COUNT+=1
)
if not "!DEVICE_COUNT!"=="1" (
  echo [ERROR] Exactly one authorized Android phone is required.
  echo.
  adb devices
  echo.
  echo Connect one phone, enable USB debugging, and accept its permission popup.
  goto :fail
)

echo [3/6] Verifying JDK 17...
java -version
if errorlevel 1 goto :fail

echo [4/6] Building arm64 development client with Gradle...
pushd "%BUILD%\android"
call gradlew.bat --stop >nul 2>&1
call gradlew.bat app:assembleDebug --no-daemon -PreactNativeArchitectures=arm64-v8a
if errorlevel 1 (
  popd
  echo [ERROR] Gradle development build failed.
  goto :fail
)
popd

if not exist "%DEV_APK%" (
  echo [ERROR] Debug APK was not found: %DEV_APK%
  goto :fail
)

echo [5/6] Saving development-client APK...
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"
copy /Y "%DEV_APK%" "%FINAL_APK%" >nul
if errorlevel 1 goto :fail

echo [6/6] Installing development client on the phone...
adb install -r "%DEV_APK%"
if errorlevel 1 (
  echo.
  echo [ERROR] Installation failed. If Android reports an incompatible
  echo signature, uninstall the existing Shree Yantra app from this test
  echo phone and run this BAT again. Uninstalling removes local app data.
  goto :fail
)

adb shell am force-stop com.shreeyantra.astrology >nul 2>&1
adb shell monkey -p com.shreeyantra.astrology -c android.intent.category.LAUNCHER 1 >nul 2>&1

for %%A in ("%FINAL_APK%") do set /a "SIZE_MB=%%~zA/1048576"
echo.
echo ============================================================
echo   DEVELOPMENT CLIENT INSTALLED
echo ============================================================
echo   APK: %FINAL_APK%
echo   Approx size: !SIZE_MB! MB
echo.
echo   For local backend plus live UI, run from mobile:
echo.
echo   set EXPO_PUBLIC_API_URL=http://192.168.0.235:4000
echo   set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.235
echo   npx expo start --dev-client --lan --clear --port 8081
echo.
echo   Rebuild this client only after native package or app config changes.
echo ============================================================
echo.
if "%NONINTERACTIVE%"=="0" pause
exit /b 0

:fail
echo.
echo ============================================================
echo   DEVELOPMENT CLIENT BUILD FAILED
echo ============================================================
echo.
if "%NONINTERACTIVE%"=="0" pause
exit /b 1
