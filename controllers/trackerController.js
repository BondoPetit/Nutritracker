const express = require('express');
const sql = require('mssql');
const router = express.Router();

const config = {
    server: 'eksamensprojekt2024.database.windows.net',
    database: 'Login',
    user: 'victoriapedersen',
    password: 'Vict4298',
    options: {
        encrypt: true
    }
};

let pool;

async function getDbPool() {
    if (!pool) {
        pool = await sql.connect(config);
    }
    return pool;
}

// Fetch all meal intakes for a user
router.get('/getMealIntakes', async (req, res) => {
    const userID = parseInt(req.query.userID, 10);
    try {
        const pool = await getDbPool();

        const result = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT mi.MealIntakeID, mi.UserID, mi.MealID, m.Name AS MealName, mi.Weight, mi.IntakeDate, mi.IntakeTime, mi.Location, mi.Calories, mi.Protein, mi.Fat, mi.Fiber
                FROM MealIntakes mi
                INNER JOIN Meals m ON mi.MealID = m.MealID
                WHERE mi.UserID = @userID
            `);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error fetching meal intakes:', err);
        res.status(500).json({ error: 'An error occurred while fetching meal intakes.' });
    }
});

// Fetch a specific meal intake by ID
router.get('/getMealIntake', async (req, res) => {
    const mealIntakeID = parseInt(req.query.recordId, 10);
    try {
        const pool = await getDbPool();

        const result = await pool.request()
            .input('mealIntakeID', sql.Int, mealIntakeID)
            .query(`
                SELECT MealIntakeID, UserID, MealID, MealName, Weight, IntakeDate, IntakeTime, Location, Calories, Protein, Fat, Fiber
                FROM MealIntakes
                WHERE MealIntakeID = @mealIntakeID
            `);

        if (result.recordset.length > 0) {
            res.status(200).json(result.recordset[0]);
        } else {
            res.status(404).json({ error: 'Meal intake not found.' });
        }
    } catch (err) {
        console.error('Error fetching meal intake:', err);
        res.status(500).json({ error: 'An error occurred while fetching meal intake.' });
    }
});

// Save or update a meal intake
router.post('/saveMealIntake', async (req, res) => {
    const { id, userID, mealID, name, weight, date, time, location, nutritionalData } = req.body;
    let calculatedNutritionalData = nutritionalData;

    try {
        console.log('Request received:', req.body);
        const pool = await getDbPool();

        // Check if the time is in the correct format (HH:mm:ss)
        const timeRegex = /^(?:[01]\d|2[0-3]):(?:[0-5]\d):(?:[0-5]\d)$/;
        if (!timeRegex.test(time)) {
            console.log('Invalid time format.');
            return res.status(400).json({ error: 'Invalid time format. Time should be in HH:mm:ss format.' });
        }

        // Fetch the nutritional information from the Meals table based on MealID
        const mealQueryResult = await pool.request()
            .input('mealID', sql.Int, mealID)
            .query(`
                SELECT MealID, Calories, Protein, Fat, Fiber FROM Meals WHERE MealID = @mealID
            `);

        // Handle case when meal not found
        if (mealQueryResult.recordset.length === 0) {
            console.log('Meal not found in database.');
            return res.status(404).json({ error: 'Meal not found.' });
        }

        // If nutritionalData is not provided, use the values from the Meals table
        if (!calculatedNutritionalData) {
            const mealData = mealQueryResult.recordset[0];
            calculatedNutritionalData = {
                energy: (mealData.Calories / 100) * weight,
                protein: (mealData.Protein / 100) * weight,
                fat: (mealData.Fat / 100) * weight,
                fiber: (mealData.Fiber / 100) * weight
            };
        }

        // Convert the time to HH:mm:ss format
        const timeParts = time.split(':');
        const formattedTime = `${timeParts[0]}:${timeParts[1]}:${timeParts[2]}`;

        // Continue with saving the meal intake
        if (id) {
            await pool.request()
                .input('mealIntakeID', sql.Int, id)
                .input('userID', sql.Int, userID)
                .input('mealID', sql.Int, mealID)
                .input('name', sql.NVarChar, name)
                .input('weight', sql.Float, weight)
                .input('intakeDate', sql.Date, date)
                .input('intakeTime', sql.Time, formattedTime)
                .input('location', sql.NVarChar, location)
                .input('calories', sql.Float, calculatedNutritionalData.energy)
                .input('protein', sql.Float, calculatedNutritionalData.protein)
                .input('fat', sql.Float, calculatedNutritionalData.fat)
                .input('fiber', sql.Float, calculatedNutritionalData.fiber)
                .query(`
                    UPDATE MealIntakes
                    SET UserID = @userID, MealID = @mealID, MealName = @name, Weight = @weight, IntakeDate = @intakeDate, IntakeTime = @intakeTime,
                        Location = @location, Calories = @calories, Protein = @protein, Fat = @fat, Fiber = @fiber
                    WHERE MealIntakeID = @mealIntakeID
                `);
        } else {
            await pool.request()
                .input('userID', sql.Int, userID)
                .input('mealID', sql.Int, mealID)
                .input('name', sql.NVarChar, name)
                .input('weight', sql.Float, weight)
                .input('intakeDate', sql.Date, date)
                .input('intakeTime', sql.Time, formattedTime)
                .input('location', sql.NVarChar, location)
                .input('calories', sql.Float, calculatedNutritionalData.energy)
                .input('protein', sql.Float, calculatedNutritionalData.protein)
                .input('fat', sql.Float, calculatedNutritionalData.fat)
                .input('fiber', sql.Float, calculatedNutritionalData.fiber)
                .query(`
                    INSERT INTO MealIntakes (UserID, MealID, MealName, Weight, IntakeDate, IntakeTime, Location, Calories, Protein, Fat, Fiber)
                    VALUES (@userID, @mealID, @name, @weight, @intakeDate, @intakeTime, @location, @calories, @protein, @fat, @fiber)
                `);
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error saving meal intake:', err);
        res.status(500).json({ error: 'An error occurred while saving the meal intake.' });
    }
});


// Delete a meal intake
router.delete('/deleteMealIntake', async (req, res) => {
    const mealIntakeID = parseInt(req.query.recordId, 10);
    try {
        const pool = await getDbPool();

        await pool.request()
            .input('mealIntakeID', sql.Int, mealIntakeID)
            .query(`
                DELETE FROM MealIntakes
                WHERE MealIntakeID = @mealIntakeID
            `);

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error deleting meal intake:', err);
        res.status(500).json({ error: 'An error occurred while deleting the meal intake.' });
    }
});

module.exports = router;
