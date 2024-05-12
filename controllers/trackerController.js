const express = require('express');
const sql = require('mssql');
const router = express.Router();
const { getPool } = require('../database');

// Fetch all meal intakes for a user
router.get('/getMealIntakes', async (req, res) => {
    const userID = parseInt(req.query.userID, 10);
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT mi.MealIntakeID, mi.UserID, mi.MealID, m.Name AS MealName, mi.Weight, CONVERT(date, mi.IntakeDate) AS IntakeDate, mi.IntakeTime, mi.Location, mi.Calories, mi.Protein, mi.Fat, mi.Fiber
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
    const mealIntakeID = parseInt(req.query.id, 10); // Changed from 'recordId' to 'id'
    try {
        const pool = await getPool();

        const result = await pool.request()
            .input('mealIntakeID', sql.Int, mealIntakeID)
            .query(`
                SELECT MealIntakeID, UserID, MealID, MealName, Weight, CONVERT(date, IntakeDate) AS IntakeDate, IntakeTime, Location, Calories, Protein, Fat, Fiber
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
        const pool = await getPool();

        console.log('ID:', id); // Log the value of id parameter

        // Convert the time string into a Date object
        const [hours, minutes, seconds] = time.split(':');
        let intakeHour = parseInt(hours, 10);


        // Ensure the hour value stays within the range of 0-23
        intakeHour = intakeHour % 24;

        const intakeTime = new Date(1970, 0, 1, intakeHour, minutes, seconds);
        // Adding one hour to intakeTime
        intakeTime.setHours(intakeTime.getHours() + 1);

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
                fiber: (mealData.Fiber / 100) * weight,
            };
        }

        // Include the id parameter in the request body if editing a meal intake
        const requestBody = {
            id: id, // Include the id parameter
            userID: userID,
            mealID: mealID,
            name: name,
            weight: weight,
            date: date,
            time: time,
            location: location,
            nutritionalData: calculatedNutritionalData
        };

        if (id) {
            // If id is provided, update the existing record
            console.log('Updating existing meal intake with ID:', id);
            await pool.request()
            .input('mealIntakeID', sql.Int, id)
            .input('userID', sql.Int, userID)
            .input('mealID', sql.Int, mealID)
            .input('name', sql.NVarChar, name)
            .input('weight', sql.Float, weight)
            .input('intakeDate', sql.Date, date)
            .input('intakeTime', sql.Time(7), intakeTime) // Using intakeTime parameter
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
            // If id is not provided, insert a new record
            console.log('Inserting new meal intake.');
            await pool.request()
                .input('userID', sql.Int, userID)
                .input('mealID', sql.Int, mealID)
                .input('name', sql.NVarChar, name)
                .input('weight', sql.Float, weight)
                .input('intakeDate', sql.Date, date)
                .input('intakeTime', sql.Time(7), intakeTime)
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
        const pool = await getPool();

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


// Fetch all ingredient intakes for a user
router.get('/getIngredientIntakes', async (req, res) => {
    const userID = parseInt(req.query.userID, 10);
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT IngredientIntakeID, UserID, Weight, CONVERT(date, IntakeDate) AS IntakeDate, Location, Energy, Protein, Fat, Fiber
                FROM IngredientIntakes
                WHERE UserID = @userID
            `);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error fetching ingredient intakes:', err);
        res.status(500).json({ error: 'An error occurred while fetching ingredient intakes.' });
    }
});

// Fetch a specific ingredient intake by ID
router.get('/getIngredientIntake', async (req, res) => {
    const ingredientIntakeID = parseInt(req.query.id, 10);
    try {
        const pool = await getPool();

        const result = await pool.request()
            .input('ingredientIntakeID', sql.Int, ingredientIntakeID)
            .query(`
                SELECT IngredientIntakeID, UserID, Weight, CONVERT(date, IntakeDate) AS IntakeDate, Location, Energy, Protein, Fat, Fiber
                FROM IngredientIntakes
                WHERE IngredientIntakeID = @ingredientIntakeID
            `);

        if (result.recordset.length > 0) {
            res.status(200).json(result.recordset[0]);
        } else {
            res.status(404).json({ error: 'Ingredient intake not found.' });
        }
    } catch (err) {
        console.error('Error fetching ingredient intake:', err);
        res.status(500).json({ error: 'An error occurred while fetching ingredient intake.' });
    }
});

// Save ingredient intake
router.post('/saveIngredientIntake', async (req, res) => {
    const { userID, ingredientName, weight, intakeDate, intakeTime, location, nutritionalData } = req.body;
    const { energy, protein, fat, fiber } = nutritionalData;

    // Parse the intakeTime string to a Date object
    const parsedIntakeTime = new Date(intakeTime);
    if (isNaN(parsedIntakeTime)) {
        return res.status(400).json({ error: 'Invalid intakeTime format.' });
    }

    // Construct SQL query or update statement
    let query = `
        INSERT INTO IngredientIntakes (UserID, IngredientName, Weight, IntakeDate, IntakeTime, Location, Energy, Protein, Fat, Fiber)
        VALUES (@userID, @ingredientName, @weight, @intakeDate, @intakeTime, @location, @energy, @protein, @fat, @fiber)
    `;

    try {
        const pool = await getPool();
        await pool.request()
            .input('userID', sql.Int, userID)
            .input('ingredientName', sql.NVarChar, ingredientName)
            .input('weight', sql.Float, weight)
            .input('intakeDate', sql.Date, intakeDate)
            .input('intakeTime', sql.Time(7), parsedIntakeTime) // Use the parsed intakeTime
            .input('location', sql.NVarChar, location)
            .input('energy', sql.Float, energy) 
            .input('protein', sql.Float, protein)
            .input('fat', sql.Float, fat)
            .input('fiber', sql.Float, fiber)
            .query(query);

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error saving ingredient intake:', err);
        res.status(500).json({ error: 'An error occurred while saving the ingredient intake: ' + err.message });
    }
});








// Delete an ingredient intake
router.delete('/deleteIngredientIntake', async (req, res) => {
    const ingredientIntakeID = parseInt(req.query.id, 10);
    try {
        const pool = await getPool();

        await pool.request()
            .input('ingredientIntakeID', sql.Int, ingredientIntakeID)
            .query(`
                DELETE FROM IngredientIntakes
                WHERE IngredientIntakeID = @ingredientIntakeID
            `);

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error deleting ingredient intake:', err);
        res.status(500).json({ error: 'An error occurred while deleting the ingredient intake.' });
    }
});


module.exports = router;
