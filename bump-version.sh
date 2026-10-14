#!/bin/bash
# Script para subir automáticamente el versionCode y versionName

GRADLE_FILE="android/app/build.gradle"

if [ ! -f "$GRADLE_FILE" ]; then
  echo "❌ Error: No se encuentra $GRADLE_FILE"
  exit 1
fi

# Leer versionCode actual
CURRENT_CODE=$(grep -oP 'versionCode \K\d+' "$GRADLE_FILE")
if [ -z "$CURRENT_CODE" ]; then
  CURRENT_CODE=1
fi

# Leer versionName actual
CURRENT_NAME=$(grep -oP 'versionName "\K[^"]+' "$GRADLE_FILE")
if [ -z "$CURRENT_NAME" ]; then
  CURRENT_NAME="1.0"
fi

# Calcular nuevo versionCode
NEW_CODE=$((CURRENT_CODE + 1))

# Calcular nuevo versionName (1.0 -> 1.1 -> 1.2 ... -> 1.9 -> 2.0)
MAJOR=$(echo "$CURRENT_NAME" | cut -d. -f1)
MINOR=$(echo "$CURRENT_NAME" | cut -d. -f2)
if [ -z "$MINOR" ]; then MINOR=0; fi

MINOR=$((MINOR + 1))
if [ $MINOR -ge 10 ]; then
  MAJOR=$((MAJOR + 1))
  MINOR=0
fi

NEW_NAME="${MAJOR}.${MINOR}"

# Reemplazar en el archivo
sed -i "s/versionCode $CURRENT_CODE/versionCode $NEW_CODE/" "$GRADLE_FILE"
sed -i "s/versionName \"$CURRENT_NAME\"/versionName \"$NEW_NAME\"/" "$GRADLE_FILE"

echo "✅ Versión actualizada:"
echo "   versionCode: $CURRENT_CODE → $NEW_CODE"
echo "   versionName: $CURRENT_NAME → $NEW_NAME"
