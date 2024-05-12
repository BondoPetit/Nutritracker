// Import required modules
const express = require('express');
const sql = require('mssql');
const router = express.Router();
const { getPool } = require('../database');

// Save or update an activity
router.post('/saveActivity', async (req, res) => {
    // Extract data from request body and query string
    const { id, activityName, duration, date, time, caloriesBurned } = req.body;
    const userIDFromQueryString = req.query.userID;
    const userID = parseInt(userIDFromQueryString, 10); // Extract and parse userID from request URL

    try {
        const pool = await getPool();

        // Convert the time string into the required format
        const activityTime = new Date(`1970-01-01T${time}`);

        // Add 1 hour to the activityTime
        activityTime.setHours(activityTime.getHours() + 1);

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
        // Handle errors
        console.error('Error saving activity:', err);
        res.status(500).json({ error: 'An error occurred while saving the activity.' });
    }
});

// Fetch all activities for a user
router.get('/getActivities', async (req, res) => {
    // Extract user ID from query string
    const userID = parseInt(req.query.userID, 10);

    try {
        const pool = await getPool();

        // Query database for user's activities
        const result = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT ActivityID, UserID, ActivityName, Duration, ActivityDate, ActivityTime, CaloriesBurned
                FROM Activities
                WHERE UserID = @userID
            `);

        // Send activities data as response
        res.status(200).json(result.recordset);
    } catch (err) {
        // Handle errors
        console.error('Error fetching activities:', err);
        res.status(500).json({ error: 'An error occurred while fetching activities.' });
    }
});

// Save or update basal metabolism
router.post('/saveBasalMetabolism', async (req, res) => {
    // Extract userID and basalMetabolism from request body
    const { userID, basalMetabolism } = req.body;

    try {
        const pool = await getPool();

        // Check if the user already has a record in the table
        const result = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT UserID FROM BasalMetabolism WHERE UserID = @userID
            `);

        if (result.recordset.length > 0) {
            // Update existing record
            await pool.request()
                .input('userID', sql.Int, userID)
                .input('basalMetabolism', sql.Float, basalMetabolism)
                .query(`
                    UPDATE BasalMetabolism
                    SET BasalMetabolism = @basalMetabolism
                    WHERE UserID = @userID
                `);
        } else {
            // Insert a new record
            await pool.request()
                .input('userID', sql.Int, userID)
                .input('basalMetabolism', sql.Float, basalMetabolism)
                .query(`
                    INSERT INTO BasalMetabolism (UserID, BasalMetabolism)
                    VALUES (@userID, @basalMetabolism)
                `);
        }

        // Send success response
        res.status(200).json({ success: true });
    } catch (err) {
        // Handle errors
        console.error('Error saving basal metabolism:', err);
        res.status(500).json({ error: 'An error occurred while saving basal metabolism.' });
    }
});

module.exports = router;
