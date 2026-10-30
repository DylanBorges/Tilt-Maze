#!/usr/bin/env bash
set -euo pipefail

source /home/dylan/.nvm/nvm.sh
nvm use 24

ENV_DIR="/home/dylan/.cache/android-build-env"
JDK_DIR="$ENV_DIR/jdk21"
SDK_DIR="$ENV_DIR/sdk"

export JAVA_HOME="$JDK_DIR"
export PATH="$JAVA_HOME/bin:$PATH"
export ANDROID_HOME="$SDK_DIR"
export ANDROID_SDK_ROOT="$SDK_DIR"
export PATH="$SDK_DIR/cmdline-tools/latest/bin:$SDK_DIR/platform-tools:$PATH"

echo "=== Compilando APK Release do Tilt Maze ==="
cd /tmp/tilt-maze-apk-build/android
echo "sdk.dir=$SDK_DIR" > local.properties
sed -i 's/reactNativeArchitectures=.*/reactNativeArchitectures=arm64-v8a/' gradle.properties

./gradlew assembleRelease --no-daemon

APK_SRC="/tmp/tilt-maze-apk-build/android/app/build/outputs/apk/release/app-release.apk"
APK_DST="/home/dylan/Jogo rani/tilt-maze.apk"

cp -f "$APK_SRC" "$APK_DST"
ls -lh "$APK_DST"
echo "✅ APK gerado com sucesso em: $APK_DST"
