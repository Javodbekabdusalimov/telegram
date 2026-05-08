#!/bin/bash
echo "🚀 KAYFQIL ishga tushmoqda..."

# Backend
echo "📡 Backend server ishga tushmoqda (port 5000)..."
cd /Users/javodbek/Desktop/telegram/backend
npm install --silent
node server.js &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Frontend
echo "🌐 Frontend ishga tushmoqda (port 3000)..."
cd /Users/javodbek/Desktop/telegram/frontend
npm start &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ KAYFQIL ishga tushdi!"
echo "🌐 Frontend: http://localhost:3000"
echo "📡 Backend:  http://localhost:5000"
echo ""
echo "To'xtatish uchun: kill $BACKEND_PID $FRONTEND_PID"

wait
