# 🚀 Deployment Guide: IoT Transformation Update

**⚠️ CRITICAL WARNING: DATA LOSS RISK**
This update changes the database structure significantly (adding `Device` and modifying `Sensor` tables).
If you have existing Sensor data on the production server, the migration **will likely ask to RESET (Delete)** the database because the new `Sensor` table requires a `code` field that didn't exist before.

## ✅ Step 1: Push Changes (Local)
Ensure all your local changes are committed and pushed to git.
*(You might need to commit the files I just created)*
```bash
git add .
git commit -m "feat: Implement IoT infrastructure (Schema, Telemetry Service)"
git push
```

## ✅ Step 2: Update Server (Remote)
Connect to your server and navigate to the project folder.

1.  **Pull the latest code:**
    ```bash
    git pull
    ```

2.  **Rebuild the Backend:**
    Since we installed new packages (`prisma` update), we must rebuild.
    ```bash
    docker-compose up -d --build backend
    ```

3.  **Run Database Migration (Interactive):**
    Run this command and **READ THE OUTPUT CAREFULLY**.
    ```bash
    docker-compose exec backend npx prisma migrate dev --name upgrade_to_iot
    ```
    *   **If it asks:** `We need to reset the mysql/postgres database. Do you want to continue?`
    *   **Type `yes`** ONLY IF you are okay with deleting old sensor data.
    *   **Type `no`** if you need to keep data (in that case, stop and ask me for a manual migration script).

## ✅ Step 3: Verify & start Simulator
Once migration is done:

1.  **Check Logs:**
    ```bash
    docker-compose logs -f backend
    ```

2.  **Start the Simulator (Optional):**
    To generate fake data and see if the dashboard works:
    ```bash
    docker-compose exec backend node scripts/simulator.js
    ```
    *You should see "Sent: { ... }" logs.*

## ✅ Step 4: Access Application
The system is now ready to accept MQTT/HTTP telemetry on `/api/telemetry`.
