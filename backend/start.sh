#!/bin/sh

echo "Waiting for database connection..."
until npx prisma db push; do
  echo "Database is not ready yet. Retrying in 5 seconds..."
  sleep 5
done

echo "Database connection established. Starting application..."
exec npm run dev
