#!/usr/bin/env bash
# Builds Daymark.apk without Gradle: the web app is copied into the APK and shown in a WebView.
#
# Needs:  JAVA_HOME      a JDK 17
#         BUILD_TOOLS    Android SDK build-tools folder (aapt2, zipalign, lib/d8.jar, lib/apksigner.jar)
#         ANDROID_JAR    android.jar of an Android platform (API 34)
#         KEYSTORE       signing keystore (created on first run; keep it, updates must use the same one)
#         KEYSTORE_PASS  its password
# Usage:  bash android/build.sh <output.apk>
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; WEB="$(dirname "$HERE")"; OUT="${1:?output apk path}"
W="$HERE/build"; rm -rf "$W"; mkdir -p "$W/assets/www" "$W/classes" "$W/gen" "$W/dex"
JAVA="$JAVA_HOME/bin/java"; JAVAC="$JAVA_HOME/bin/javac"; KEYTOOL="$JAVA_HOME/bin/keytool"
VERSION="$(grep -o "VERSION='[0-9.]*'" "$WEB/js/app.js" | grep -o "[0-9.]*")"
CODE="$(echo "$VERSION" | awk -F. '{print $1*10000+$2*100+$3}')"

# 1. web app -> assets (no service worker: nothing to cache, every file is already in the APK)
cp "$WEB/index.html" "$WEB/manifest.webmanifest" "$W/assets/www/"
cp -r "$WEB/css" "$WEB/js" "$WEB/fonts" "$WEB/icons" "$W/assets/www/"

# 2. resources + manifest
"$BUILD_TOOLS/aapt2" compile --dir "$HERE/res" -o "$W/res.zip"
"$BUILD_TOOLS/aapt2" link -o "$W/base.apk" -I "$ANDROID_JAR" --manifest "$HERE/AndroidManifest.xml" \
  --java "$W/gen" --min-sdk-version 24 --target-sdk-version 34 \
  --version-code "$CODE" --version-name "$VERSION" "$W/res.zip"

# 3. Java -> dex
"$JAVAC" -source 8 -target 8 -Xlint:-options -bootclasspath "$ANDROID_JAR" -d "$W/classes" \
  $(find "$HERE/src" "$W/gen" -name '*.java')
"$JAVA" -cp "$BUILD_TOOLS/lib/d8.jar" com.android.tools.r8.D8 --release --min-api 24 --lib "$ANDROID_JAR" \
  --output "$W/dex" $(find "$W/classes" -name '*.class')

# 4. add the web files, dex; align, sign
# (aapt2 -A on Windows writes nested asset names with backslashes, which Android cannot open,
#  so the assets are added here with forward-slash names instead)
python -I -c "
import os,sys,zipfile
apk,root=sys.argv[1],sys.argv[2]
z=zipfile.ZipFile(apk,'a',zipfile.ZIP_DEFLATED)
for d,_,fs in os.walk(root):
    for f in sorted(fs):
        full=os.path.join(d,f); z.write(full,'assets/'+os.path.relpath(full,root).replace(os.sep,'/'))
z.close()" "$W/base.apk" "$W/assets"
(cd "$W/dex" && "$BUILD_TOOLS/aapt" add "$W/base.apk" classes.dex >/dev/null)
"$BUILD_TOOLS/zipalign" -f -p 4 "$W/base.apk" "$W/aligned.apk"
if [ ! -f "$KEYSTORE" ]; then
  "$KEYTOOL" -genkeypair -keystore "$KEYSTORE" -storepass "$KEYSTORE_PASS" -keypass "$KEYSTORE_PASS" -alias daymark \
    -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Daymark" >/dev/null 2>&1
fi
"$JAVA" -jar "$BUILD_TOOLS/lib/apksigner.jar" sign --ks "$KEYSTORE" --ks-pass "pass:$KEYSTORE_PASS" --ks-key-alias daymark \
  --out "$OUT" "$W/aligned.apk"
"$JAVA" -jar "$BUILD_TOOLS/lib/apksigner.jar" verify --verbose "$OUT" | head -6
rm -rf "$W" "$OUT.idsig"
echo "built $OUT (version $VERSION, code $CODE)"
