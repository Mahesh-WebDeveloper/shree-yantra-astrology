@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Shree Yantra - Build Latest Android APK
color 0E
set "NONINTERACTIVE=0"
set "SYNC_ONLY=0"
for %%A in (%*) do (
  if /I "%%~A"=="--non-interactive" set "NONINTERACTIVE=1"
  if /I "%%~A"=="--sync-only" set "SYNC_ONLY=1"
)

rem One-click local Android APK builder for Shree Yantra Astrology.
rem The stable native Android project stays in C:\m. Latest React Native
rem source, assets, config, environment, and dependencies are synchronized.

set "ROOT=%~dp0"
set "SOURCE=%ROOT%mobile"
set "BUILD=C:\m"
set "OUTPUT_DIR=A:\android-build"
set "LATEST_APK=%OUTPUT_DIR%\shree-yantra-latest.apk"
set "PREVIOUS_APK=%OUTPUT_DIR%\shree-yantra-previous.apk"
set "FAIL_MARKER=%OUTPUT_DIR%\SHREE_YANTRA_BUILD_FAILED.txt"
set "JAVA_HOME=A:\android-build\jdk17\jdk-17.0.19+10"
set "ANDROID_HOME=A:\android-build\android-sdk"
set "NODE_ENV=production"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"

echo.
echo ============================================================
echo   SHREE YANTRA - LATEST APK BUILDER
echo ============================================================
echo.

call :require_dir "%SOURCE%" "Mobile source folder"
if errorlevel 1 goto :fail
call :require_dir "%BUILD%\android" "C:\m native Android build folder"
if errorlevel 1 goto :fail
call :require_dir "%JAVA_HOME%" "JDK 17"
if errorlevel 1 goto :fail
call :require_dir "%ANDROID_HOME%" "Android SDK"
if errorlevel 1 goto :fail

where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm was not found. Install Node.js or add it to PATH.
  goto :fail
)

if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"
if errorlevel 1 (
  echo [ERROR] Could not create output folder: %OUTPUT_DIR%
  goto :fail
)

echo [1/7] Checking whether dependencies changed...
set "INSTALL_DEPS=0"
if not exist "%BUILD%\node_modules" set "INSTALL_DEPS=1"
if not exist "%BUILD%\node_modules\typescript\bin\tsc" set "INSTALL_DEPS=1"
if not exist "%BUILD%\node_modules\expo\package.json" set "INSTALL_DEPS=1"
if not exist "%BUILD%\package.json" set "INSTALL_DEPS=1"
if not exist "%BUILD%\package-lock.json" set "INSTALL_DEPS=1"
if exist "%BUILD%\package.json" (
  fc /b "%SOURCE%\package.json" "%BUILD%\package.json" >nul 2>&1
  if errorlevel 1 set "INSTALL_DEPS=1"
)
if exist "%BUILD%\package-lock.json" (
  fc /b "%SOURCE%\package-lock.json" "%BUILD%\package-lock.json" >nul 2>&1
  if errorlevel 1 set "INSTALL_DEPS=1"
)

echo [2/7] Synchronizing latest app source and assets...
call :sync_dir "%SOURCE%\src" "%BUILD%\src"
if errorlevel 1 goto :fail
call :sync_dir "%SOURCE%\assets" "%BUILD%\assets"
if errorlevel 1 goto :fail
if exist "%SOURCE%\plugins" (
  call :sync_dir "%SOURCE%\plugins" "%BUILD%\plugins"
  if errorlevel 1 goto :fail
)

for %%F in (App.tsx app.json babel.config.js index.js metro.config.js tsconfig.json package.json package-lock.json google-services.json) do (
  if not exist "%SOURCE%\%%F" (
    echo [ERROR] Required file is missing: %SOURCE%\%%F
    goto :fail
  )
  copy /Y "%SOURCE%\%%F" "%BUILD%\%%F" >nul
  if errorlevel 1 (
    echo [ERROR] Could not copy %%F to %BUILD%.
    goto :fail
  )
)

if not exist "%SOURCE%\.env" (
  echo [ERROR] %SOURCE%\.env is missing. APK API URL cannot be selected safely.
  goto :fail
)
copy /Y "%SOURCE%\.env" "%BUILD%\.env" >nul
if errorlevel 1 (
  echo [ERROR] Could not copy the mobile .env file.
  goto :fail
)

rem Keep required native permissions in the stable C:\m Android project current.
set "SOURCE_MANIFEST=%SOURCE%\android\app\src\main\AndroidManifest.xml"
set "BUILD_MANIFEST=%BUILD%\android\app\src\main\AndroidManifest.xml"
if exist "!SOURCE_MANIFEST!" copy /Y "!SOURCE_MANIFEST!" "!BUILD_MANIFEST!" >nul
if not exist "!BUILD_MANIFEST!" (
  echo [ERROR] Stable AndroidManifest.xml is missing: !BUILD_MANIFEST!
  goto :fail
)
findstr /C:"android.permission.ACCESS_NETWORK_STATE" "!BUILD_MANIFEST!" >nul
if errorlevel 1 (
  echo [ERROR] ACCESS_NETWORK_STATE is missing from !BUILD_MANIFEST!.
  echo         Regenerate or update the stable Android native project.
  goto :fail
)

if "%INSTALL_DEPS%"=="1" (
  echo [3/7] Installing exact dependencies from package-lock.json...
  pushd "%BUILD%"
  call npm ci --no-audit --no-fund
  if errorlevel 1 (
    popd
    echo [ERROR] npm ci failed in %BUILD%.
    goto :fail
  )
  popd
) else (
  echo [3/7] Dependencies are unchanged. Reusing %BUILD%\node_modules.
)

echo [4/7] Running TypeScript validation...
pushd "%BUILD%"
call npx tsc --noEmit
if errorlevel 1 (
  popd
  echo [ERROR] TypeScript validation failed. APK was not built.
  goto :fail
)
popd

if "%SYNC_ONLY%"=="1" (
  echo [OK] Latest mobile files, dependencies, and TypeScript are ready in %BUILD%.
  exit /b 0
)

rem Never leave an older APK named "latest" after a failed full build. Keep one
rem clearly labelled fallback and publish "latest" only after complete success.
if exist "!LATEST_APK!" move /Y "!LATEST_APK!" "!PREVIOUS_APK!" >nul
if exist "!FAIL_MARKER!" del /Q "!FAIL_MARKER!" >nul 2>&1

echo [5/7] Verifying Java 17...
java -version
if errorlevel 1 (
  echo [ERROR] Java failed to start from %JAVA_HOME%.
  goto :fail
)

for /f %%I in ('powershell.exe -NoProfile -Command "[math]::Floor((Get-PSDrive -Name C).Free / 1GB)"') do set "FREE_C_GB=%%I"
if not defined FREE_C_GB (
  echo [ERROR] Could not check free space on C:.
  goto :fail
)
if !FREE_C_GB! LSS 4 (
  echo [ERROR] C: has only !FREE_C_GB! GB free. At least 4 GB is required.
  echo         Free disk space and run this builder again.
  goto :fail
)
echo       C: free space: !FREE_C_GB! GB

echo [6/7] Building the release APK with Gradle...
pushd "%BUILD%\android"
call gradlew.bat --stop >nul 2>&1
call gradlew.bat assembleRelease --no-daemon
if errorlevel 1 (
  popd
  echo [ERROR] Gradle build failed. Read the error shown above.
  goto :fail
)
popd

set "GRADLE_APK=%BUILD%\android\app\build\outputs\apk\release\app-release.apk"
if not exist "%GRADLE_APK%" (
  echo [ERROR] Gradle reported success but APK was not found:
  echo         %GRADLE_APK%
  goto :fail
)

for /f %%I in ('powershell.exe -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "STAMP=%%I"
set "DATED_APK=%OUTPUT_DIR%\shree-yantra-latest-!STAMP!.apk"

echo [7/7] Copying and verifying the final APK...
copy /Y "%GRADLE_APK%" "!DATED_APK!" >nul
if errorlevel 1 goto :copy_failed
copy /Y "%GRADLE_APK%" "!LATEST_APK!" >nul
if errorlevel 1 goto :copy_failed
if exist "!FAIL_MARKER!" del /Q "!FAIL_MARKER!" >nul 2>&1

echo.
echo SHA-256:
certutil -hashfile "!DATED_APK!" SHA256 | findstr /V /C:"CertUtil"

if exist "%ANDROID_HOME%\build-tools\36.0.0\apksigner.bat" (
  call "%ANDROID_HOME%\build-tools\36.0.0\apksigner.bat" verify "!DATED_APK!"
  if errorlevel 1 (
    echo [ERROR] APK signature verification failed.
    goto :fail
  )
)

for %%A in ("!DATED_APK!") do set /a "SIZE_MB=%%~zA/1048576"
echo.
echo ============================================================
echo   BUILD SUCCESSFUL
echo ============================================================
echo   APK: !DATED_APK!
echo   Latest copy: !LATEST_APK!
echo   Approx size: !SIZE_MB! MB
echo.
echo   This APK contains the JavaScript bundle and does not need
echo   Metro or Expo Go. It uses the API URL from mobile\.env.
echo.
echo   NOTE: The current C:\m release is signed with the Android
echo   debug certificate. Use it for local/demo testing, not for
echo   Google Play production publishing.
echo ============================================================
echo.
if "%NONINTERACTIVE%"=="0" explorer.exe /select,"!DATED_APK!"
if "%NONINTERACTIVE%"=="0" pause
exit /b 0

:copy_failed
echo [ERROR] APK was built, but it could not be copied to %OUTPUT_DIR%.
goto :fail

:sync_dir
if not exist "%~1" (
  echo [ERROR] Source directory is missing: %~1
  exit /b 1
)
if /I not "%BUILD%"=="C:\m" (
  echo [ERROR] Safety check refused to synchronize unexpected build path: %BUILD%
  exit /b 1
)
robocopy "%~1" "%~2" /MIR /R:1 /W:1 /MT:16 /XJ /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 (
  echo [ERROR] Robocopy failed while synchronizing %~1.
  exit /b 1
)
exit /b 0

:require_dir
if not exist "%~1\." (
  echo [ERROR] %~2 was not found:
  echo         %~1
  exit /b 1
)
exit /b 0

:fail
>"!FAIL_MARKER!" echo BUILD FAILED at %DATE% %TIME%. shree-yantra-latest.apk was not published. Read the console error and rebuild.
echo.
echo ============================================================
echo   BUILD FAILED - no new APK was published
echo ============================================================
echo.
if "%NONINTERACTIVE%"=="0" pause
exit /b 1
