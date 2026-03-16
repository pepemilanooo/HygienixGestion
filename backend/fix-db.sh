#!/bin/bash

# Script per fixare il database corrotto su Railway

echo "Fixing database migration issue..."

# Usa il database corretto
export DATABASE_URL="file:/data/dev.db"

# Tenta di risolvere la migration fallita
echo "Attempting to resolve failed migration..."
npx prisma migrate resolve --rolled-back 20260316164455_add_sopralluogo_data 2>/dev/null || true

# Se non funziona, usa db push
echo "Syncing database schema..."
npx prisma db push --accept-data-loss

# Avvia il server
echo "Starting server..."
node src/server.js
