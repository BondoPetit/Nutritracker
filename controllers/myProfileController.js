const express = require('express');
const sql = require('mssql');
const router = express.Router();
const { getPool } = require('../database');

// Route for handling user body data submission
router.post('/submit-body-data', async (req, res) => {
    // Extract user body data from request body
    const { userID, height, weight, age, gender } = req.body;
    try {
        const pool = await getPool();
        // Execute query to insert user body data
        await pool.request()
            .input('userID', sql.Int, userID)
            .input('height', sql.Float, height)
            .input('weight', sql.Float, weight)
            .input('age', sql.Int, age)
            .input('gender', sql.NVarChar, gender)
            .query(`
                INSERT INTO UserDetails (UserID, Height, Weight, Age, Gender)
                VALUES (@userID, @height, @weight, @age, @gender)
            `);
        // Redirect to meal creator page with user ID
        res.redirect(`/MealCreator.html?userID=${userID}`);
    } catch (err) {
        // Handle errors during body data submission
        console.error('Error submitting body data:', err);
        res.status(500).json({ error: 'An error occurred while submitting body data.' });
    }
});

module.exports = router;
