const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { getPool } = require('../database');

// Route to update user data
router.post('/updateUserData', async (req, res) => {
    // Extract user data from request body
    const { userID, height, weight, age, gender } = req.body;
    try {
        const pool = await getPool();
        // Check if the user exists
        const userResult = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT UserID
                FROM Users
                WHERE UserID = @userID
            `);
        if (userResult.recordset.length === 0) {
            res.status(404).send('User not found');
            return;
        }
        // Update user data in UserDetails table
        await pool.request()
            .input('height', sql.Float, height)
            .input('weight', sql.Float, weight)
            .input('age', sql.Int, age)
            .input('gender', sql.NVarChar, gender)
            .input('userID', sql.Int, userID)
            .query(`
                UPDATE UserDetails
                SET Height = @height, Weight = @weight, Age = @age, Gender = @gender
                WHERE UserID = @userID
            `);
        res.status(200).send('User data updated successfully');
    } catch (err) {
        console.error('Error updating user data:', err);
        res.status(500).send('Failed to update user data');
    }
});

// Route to fetch user data based on userID
router.get('/getUserData', async (req, res) => {
    const userID = req.query.userID;
    try {
        const pool = await getPool();
        // Fetch user data from Users and UserDetails tables
        const result = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT Email, Height, Weight, Age, Gender
                FROM Users
                INNER JOIN UserDetails ON Users.UserID = UserDetails.UserID
                WHERE Users.UserID = @userID
            `);
        if (result.recordset.length > 0) {
            const userData = result.recordset[0];
            res.json(userData);
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        console.error('Error fetching user data:', err);
        res.status(500).send('An error occurred while fetching user data');
    }
});

// Route to delete user account and associated data
router.delete('/deleteUser', async (req, res) => {
    const { userID } = req.query;
    try {
        const pool = await getPool();
        // Delete user-related data from BasalMetabolism and UserDetails tables
        await pool.request()
            .input('userID', sql.Int, userID)
            .query('DELETE FROM BasalMetabolism WHERE UserID = @userID');
        await pool.request()
            .input('userID', sql.Int, userID)
            .query('DELETE FROM UserDetails WHERE UserID = @userID');
        // Delete user from Users table
        await pool.request()
            .input('userID', sql.Int, userID)
            .query('DELETE FROM Users WHERE UserID = @userID');
        res.sendStatus(200);
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).send('Failed to delete user');
    }
});

module.exports = router;
