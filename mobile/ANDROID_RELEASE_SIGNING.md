# Android Release Signing

Production APK/AAB files must never use `android/app/debug.keystore`. The Gradle build now refuses a Release task unless all private signing values are supplied through environment variables.

Create the upload keystore once and back it up securely:

```powershell
keytool -genkeypair -v -storetype PKCS12 -keystore A:\secure\shree-yantra-upload.p12 -alias shree-yantra-upload -keyalg RSA -keysize 4096 -validity 10000
```

Set the values only in the release build environment:

```powershell
$env:SHREE_RELEASE_STORE_FILE='A:\secure\shree-yantra-upload.p12'
$env:SHREE_RELEASE_STORE_PASSWORD='...'
$env:SHREE_RELEASE_KEY_ALIAS='shree-yantra-upload'
$env:SHREE_RELEASE_KEY_PASSWORD='...'
```

Then build with JDK 17 from the short-path staging project:

```powershell
./gradlew app:bundleRelease --no-daemon --max-workers=1
```

Do not commit the keystore or passwords. Losing the upload key without a Play Console reset process can block future updates. For Google Play, enable Play App Signing and keep the upload key separate from the Play-managed app signing key.
