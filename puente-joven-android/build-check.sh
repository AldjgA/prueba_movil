#!/usr/bin/env bash
# Build harness aislado: usa un GRADLE_USER_HOME propio para que el
# `gradlew --stop` externo (que apunta a ~/.gradle) NO mate este daemon.
set -u
cd "C:/Users/patito/WorkBuddy AI/2026-09-28-00-32-45/puente-joven-android" || exit 9
export JAVA_HOME="C:/Program Files/Java/jdk-17"
OUT=/tmp/pj_build.log
: > "$OUT"
{
  echo "=== START $(date) ==="
  ./gradlew :app:assembleDebug \
    --no-build-cache \
    --console=plain \
    -g "/c/Users/patito/WorkBuddy AI/2026-09-28-00-32-45/puente-joven-android/.gradle-home" \
    --stacktrace
  echo "=== EXIT=$? $(date) ==="
} >> "$OUT" 2>&1
