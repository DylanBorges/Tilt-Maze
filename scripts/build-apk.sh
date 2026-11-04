#!/usr/bin/env bash
set -euo pipefail

source /home/dylan/.nvm/nvm.sh
nvm use 24

ENV_DIR="/home/dylan/.cache/android-build-env"
JDK_DIR="$ENV_DIR/jdk21"
SDK_DIR="$ENV_DIR/sdk"
BUILD_DIR="/tmp/tilt-maze-apk-build"

export JAVA_HOME="$JDK_DIR"
export PATH="$JAVA_HOME/bin:$PATH"
export ANDROID_HOME="$SDK_DIR"
export ANDROID_SDK_ROOT="$SDK_DIR"
export PATH="$SDK_DIR/cmdline-tools/latest/bin:$SDK_DIR/platform-tools:$PATH"

echo "=== [1/2] Sincronizando código atualizado ==="
mkdir -p "$BUILD_DIR"
rsync -a --exclude '/.git' "/home/dylan/Jogo rani/" "$BUILD_DIR/"

cd "$BUILD_DIR"
if [ ! -d "$BUILD_DIR/android" ]; then
  CI=1 npx expo prebuild --platform android --no-install
fi

echo "=== [2/2] Compilando APK Release estável ==="
cd "$BUILD_DIR/android"
echo "sdk.dir=$SDK_DIR" > local.properties
sed -i 's/reactNativeArchitectures=.*/reactNativeArchitectures=arm64-v8a/' gradle.properties
sed -i 's/org.gradle.parallel=.*/org.gradle.parallel=false/' gradle.properties || true
sed -i '/org.gradle.workers.max/d' gradle.properties
printf "\norg.gradle.workers.max=4\n" >> gradle.properties
sed -i 's/expo.inlineModules.watchedDirectories=\[\]org.gradle.workers.max=4/expo.inlineModules.watchedDirectories=\[\]/' gradle.properties

./gradlew assembleRelease --no-daemon --max-workers=4

APK_SRC="$BUILD_DIR/android/app/build/outputs/apk/release/app-release.apk"
APK_DST="/home/dylan/Jogo rani/tilt-maze.apk"

cp -f "$APK_SRC" "$APK_DST"
ls -lh "$APK_DST"
echo "✅ APK gerado com sucesso em: $APK_DST"
