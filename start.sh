#!/bin/bash
echo "KAYFQIL Railway-da ishga tushmoqda..."

echo "Frontend build qilinmoqda..."
cd frontend
npm install --silent
npm run build

echo "Backend ishga tushmoqda..."
cd ../backend
npm install --silent
node server.js
