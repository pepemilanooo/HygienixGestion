#!/bin/bash

echo "=== Database Fix Script ==="
echo "Current DATABASE_URL: $DATABASE_URL"

# Se DATABASE_URL non è settato, usiamo il default
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:/data/dev.db"
fi

echo "Using DATABASE_URL: $DATABASE_URL"

# Estrai il percorso del file database
DB_FILE="/data/dev.db"

# Verifica se il database esiste
if [ -f "$DB_FILE" ]; then
  echo "Database found at $DB_FILE"
  
  # Verifica se esiste la tabella _prisma_migrations
  echo "Checking _prisma_migrations table..."
  
  # Usa sqlite3 per cancellare la migration fallita
  if command -v sqlite3 &> /dev/null; then
    echo "Removing failed migration record..."
    sqlite3 "$DB_FILE" "DELETE FROM _prisma_migrations WHERE migration_name = '20260316164455_add_sopralluogo_data';" 2>/dev/null || echo "Table or record not found, continuing..."
    echo "Migration record removed (if existed)"
  else
    echo "sqlite3 not available, trying alternative method..."
  fi
else
  echo "Database not found, will create new one"
fi

# Ora prova a risolvere con Prisma
echo "=== Resolving with Prisma ==="
npx prisma migrate resolve --rolled-back 20260316164455_add_sopralluogo_data 2>/dev/null || echo "Migration resolution skipped"

echo "=== Syncing schema ==="
npx prisma db push --accept-data-loss

echo "=== Starting server ==="
node src/server.js
