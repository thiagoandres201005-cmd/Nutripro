#!/bin/bash
# Script todo-en-uno: bump version + build + sync + push

set -e  # Detener si hay error

echo "🚀 Iniciando deploy..."
echo ""

# 1. Subir versión
echo "📌 Paso 1/5: Subiendo versión..."
./bump-version.sh
echo ""

# 2. Limpiar dist anterior
echo "🧹 Paso 2/5: Limpiando dist anterior..."
rm -rf dist
echo ""

# 3. Compilar
echo "🔨 Paso 3/5: Compilando con Vite..."
npm run build
echo ""

# 4. Sincronizar con Android
echo "📱 Paso 4/5: Sincronizando con Android..."
npx cap sync android
echo ""

# 5. Git add + commit + push
echo "📤 Paso 5/5: Subiendo a GitHub..."
NEW_VERSION=$(grep -oP 'versionName "\K[^"]+' android/app/build.gradle)
git add -A
git commit -m "v${NEW_VERSION}: build automático" || echo "Sin cambios para commitear"
git push

echo ""
echo "✅ ¡Deploy completado! Versión: v${NEW_VERSION}"
echo "🔗 Andá a GitHub Actions para ver el build:"
echo "   https://github.com/thiagoandres201005-cmd/Nutripro/actions"
