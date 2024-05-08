const express = require('express');
const sql = require('mssql');
const router = express.Router();
const { getPool } = require('../database'); // Adjust the path as necessary

// Route for handling user body data submission
router.post('/submit-body-data', async (req, res) => {
    const { userID, height, weight, age, gender } = req.body;
    try {
        const pool = await getPool();
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
        res.redirect(`/MealCreator.html?userID=${userID}`);
    } catch (err) {
        console.error('Error submitting body data:', err);
        res.status(500).json({ error: 'An error occurred while submitting body data.' });
    }
});

module.exports = router;
