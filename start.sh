#!/bin/bash
echo "🚀 KAYFQIL Railway-da ishga tushmoqda..."

# 1. Backend papkasiga kirib dependencylarni o'rnatish
echo "📡 Backend tayyorlanmoqda..."
cd backend
npm install --silent

# 2. Frontend build qilish (Agar hali build bo'lmagan bo'lsa)
echo "🌐 Frontend build qilinmoqda..."
cd ../frontend
npm install --silent
npm run build # React/Vite loyihasini static fayllarga aylantiradi

# 3. Backend-ni ishga tushirish (Frontend build-ni ham shu servis qiladi)
echo "📡 Server ishga tushmoqda..."
cd ../backend
node server.js