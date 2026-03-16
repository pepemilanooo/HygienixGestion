#!/bin/bash
# Start script per Railway che gestisce migration fallite

echo "🚀 Hygienix Backend Starting..."
echo "Database URL: $DATABASE_URL"

# Per SQLite su Railway, usiamo db push invece di migrate deploy
# perché gestisce meglio i casi di migration fallita
echo "📦 Updating database schema..."
npx prisma db push --accept-data-loss || {
  echo "⚠️  db push failed, trying migrate resolve..."
  npx prisma migrate resolve --rolled-back "20260316164455_add_sopralluogo_data" || true
  npx prisma db push --accept-data-loss
}

echo "✅ Database ready"
echo "🌐 Starting server..."
node src/server.js
