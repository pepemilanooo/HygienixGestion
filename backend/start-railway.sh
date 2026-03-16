#!/bin/bash
# Script per Railway che gestisce database corrotto

echo "🚀 Hygienix Backend Starting..."
echo "Database path: /data/dev.db"

# Se il database esiste e c'è problema di migration, lo cancelliamo
if [ -f "/data/dev.db" ]; then
  echo "📦 Checking database..."
  
  # Prova a fare migrate deploy
  if ! npx prisma migrate deploy 2>&1; then
    echo "⚠️  Migration failed, resetting database..."
    
    # Backup del database esistente (giusto per sicurezza)
    cp /data/dev.db /data/dev.db.backup.$(date +%s) 2>/dev/null || true
    
    # Cancelliamo il database corrotto
    rm -f /data/dev.db
    rm -f /data/dev.db-journal
    rm -f /data/dev.db-wal
    
    echo "🗑️  Corrupted database removed"
  fi
fi

# Se il database non esiste (o è stato cancellato), lo creiamo
if [ ! -f "/data/dev.db" ]; then
  echo "📦 Creating new database..."
  npx prisma migrate deploy || {
    echo "⚠️  Migrate failed, trying db push..."
    npx prisma db push --accept-data-loss
  }
  
  # Opzionale: popola con dati di esempio
  # npx prisma db seed || true
fi

echo "✅ Database ready"
echo "🌐 Starting server..."
node src/server.js
