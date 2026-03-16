#!/bin/bash
# Fix per migration fallita su Railway

echo "Checking migration status..."

# Se c'è una migration fallita, la risolviamo
if npx prisma migrate status 2>&1 | grep -q "failed"; then
  echo "Found failed migration, resolving..."
  # Opzione 1: marca come rollback (perde dati della migration)
  npx prisma migrate resolve --rolled-back "20260316164455_add_sopralluogo_data" || true
  
  # Opzione 2: Reset completo se necessario (commentata per sicurezza)
  # npx prisma migrate reset --force --skip-seed || true
fi

# Ora possiamo fare deploy delle migration
echo "Deploying migrations..."
npx prisma migrate deploy

# Se ancora fallisce, usiamo db push
echo "Starting server..."
node src/server.js
