const express = require('express');
const sql = require('mssql');
const router = express.Router();

const config = {
    server: 'eksamensprojekt2024.database.windows.net',
    database: 'Login',
    user: 'victoriapedersen',
    password: 'Vict4298',
    options: {
        encrypt: true,
    },
};

let pool;

async function getDbPool() {
    if (!pool) {
        pool = await sql.connect(config);
    }
    return pool;
}

// Save or update an activity
router.post('/saveActivity', async (req, res) => {
    const { id, userID, activityName, duration, date, time, caloriesBurned } = req.body;

    try {
        const pool = await getDbPool();

        // Convert the time string into the required format
        const activityTime = new Date(`1970-01-01T${time}`);

        if (id) {
            // Update an existing record
            await pool.request()
                .input('activityID', sql.Int, id)
                .input('userID', sql.Int, userID)
                .input('activityName', sql.NVarChar, activityName)
                .input('duration', sql.Int, duration)
                .input('activityDate', sql.Date, date)
                .input('activityTime', sql.Time(7), activityTime)
                .input('caloriesBurned', sql.Float, caloriesBurned)
                .query(`
                    UPDATE Activities
                    SET UserID = @userID, ActivityName = @activityName, Duration = @duration, ActivityDate = @activityDate, ActivityTime = @activityTime, CaloriesBurned = @caloriesBurned
                    WHERE ActivityID = @activityID
                `);
        } else {
            // Insert a new record
            await pool.request()
                .input('userID', sql.Int, userID)
                .input('activityName', sql.NVarChar, activityName)
                .input('duration', sql.Int, duration)
                .input('activityDate', sql.Date, date)
                .input('activityTime', sql.Time(7), activityTime)
                .input('caloriesBurned', sql.Float, caloriesBurned)
                .query(`
                    INSERT INTO Activities (UserID, ActivityName, Duration, ActivityDate, ActivityTime, CaloriesBurned)
                    VALUES (@userID, @activityName, @duration, @activityDate, @activityTime, @caloriesBurned)
                `);
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error saving activity:', err);
        res.status(500).json({ error: 'An error occurred while saving the activity.' });
    }
});

// Fetch all activities for a user
router.get('/getActivities', async (req, res) => {
    const userID = parseInt(req.query.userID, 10);

    try {
        const pool = await getDbPool();

        const result = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT ActivityID, UserID, ActivityName, Duration, ActivityDate, ActivityTime, CaloriesBurned
                FROM Activities
                WHERE UserID = @userID
            `);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error fetching activities:', err);
        res.status(500).json({ error: 'An error occurred while fetching activities.' });
    }
});

// Delete an activity
router.delete('/deleteActivity', async (req, res) => {
    const activityID = parseInt(req.query.recordId, 10);

    try {
        const pool = await getDbPool();

        await pool.request()
            .input('activityID', sql.Int, activityID)
            .query(`
                DELETE FROM Activities
                WHERE ActivityID = @activityID
            `);

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error deleting activity:', err);
        res.status(500).json({ error: 'An error occurred while deleting the activity.' });
    }
});

module.exports = router;