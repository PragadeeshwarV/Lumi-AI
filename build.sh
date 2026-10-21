#!/usr/bin/env bash
# ==============================================================================
# LUMI AI - UNIFIED BUILD SCRIPT FOR RENDER (NATIVE RUNTIME)
# ==============================================================================
set -o errexit

echo "===> Installing Python backend dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "===> Checking for Node.js / npm to build frontend..."
if command -v npm &> /dev/null; then
    echo "===> Building React frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
else
    echo "===> Note: npm not found in native python environment; ensure pre-built frontend/dist is present."
fi

echo "===> Build completed successfully!"
