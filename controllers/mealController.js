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

// Fetch all meals and their ingredients for a user
router.get('/getMeals', async (req, res) => {
    const userID = parseInt(req.query.userID, 10);
    try {
        const pool = await getDbPool();

        // Fetch meals for a specific user
        const mealResults = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT MealID, UserID, Name, CreationDate, Calories, Protein, Fat, Fiber, TotalWeight
                FROM Meals
                WHERE UserID = @userID
            `);

        // Fetch ingredients for those meals
        const ingredientResults = await pool.request()
            .query(`
                SELECT IngredientID, MealID, Name, Weight, Energy, Protein, Fat, Fiber
                FROM MealIngredients
            `);

        const meals = mealResults.recordset;
        const ingredients = ingredientResults.recordset;

        // Organize ingredients by meal ID
        const mealsWithIngredients = meals.map(meal => {
            meal.ingredients = ingredients.filter(ingredient => ingredient.MealID === meal.MealID);
            return meal;
        });

        res.status(200).json(mealsWithIngredients);
    } catch (err) {
        console.error('Error fetching meals:', err);
        res.status(500).json({ error: 'An error occurred while fetching meals.' });
    }
});

// Fetch a specific meal by ID
router.get('/getMeal', async (req, res) => {
    const mealID = parseInt(req.query.id, 10);
    try {
        const pool = await getDbPool();

        // Fetch meal
        const mealResult = await pool.request()
            .input('mealID', sql.Int, mealID)
            .query(`
                SELECT MealID, UserID, Name, CreationDate, Calories, Protein, Fat, Fiber, TotalWeight
                FROM Meals
                WHERE MealID = @mealID
            `);

        if (mealResult.recordset.length === 0) {
            res.status(404).json({ error: 'Meal not found.' });
            return;
        }

        const meal = mealResult.recordset[0];

        // Fetch ingredients for the meal
        const ingredientResult = await pool.request()
            .input('mealID', sql.Int, mealID)
            .query(`
                SELECT IngredientID, MealID, Name, Weight, Energy, Protein, Fat, Fiber
                FROM MealIngredients
                WHERE MealID = @mealID
            `);

        meal.ingredients = ingredientResult.recordset;

        res.status(200).json(meal);
    } catch (err) {
        console.error('Error fetching meal:', err);
        res.status(500).json({ error: 'An error occurred while fetching the meal.' });
    }
});

// Save or update a meal
router.post('/saveMeal', async (req, res) => {
    let { mealID, userID, mealName, creationDate, ingredients, nutritionalData } = req.body;

    try {
        const pool = await getDbPool();

        if (mealID) {
            // Update existing meal
            await pool.request()
                .input('mealID', sql.Int, mealID)
                .input('userID', sql.Int, userID)
                .input('mealName', sql.NVarChar, mealName)
                .input('creationDate', sql.Date, creationDate)
                .input('calories', sql.Float, nutritionalData.calories)
                .input('protein', sql.Float, nutritionalData.protein)
                .input('fat', sql.Float, nutritionalData.fat)
                .input('fiber', sql.Float, nutritionalData.fiber)
                .input('totalWeight', sql.Float, nutritionalData.totalWeight)
                .query(`
                    UPDATE Meals
                    SET UserID = @userID, Name = @mealName, CreationDate = @creationDate, Calories = @calories, Protein = @protein, Fat = @fat, Fiber = @fiber, TotalWeight = @totalWeight
                    WHERE MealID = @mealID
                `);

            // Delete existing ingredients for the meal
            await pool.request()
                .input('mealID', sql.Int, mealID)
                .query(`
                    DELETE FROM MealIngredients
                    WHERE MealID = @mealID
                `);
        } else {
            // Insert new meal
            const mealResult = await pool.request()
                .input('userID', sql.Int, userID)
                .input('mealName', sql.NVarChar, mealName)
                .input('creationDate', sql.Date, creationDate)
                .input('calories', sql.Float, nutritionalData.calories)
                .input('protein', sql.Float, nutritionalData.protein)
                .input('fat', sql.Float, nutritionalData.fat)
                .input('fiber', sql.Float, nutritionalData.fiber)
                .input('totalWeight', sql.Float, nutritionalData.totalWeight)
                .query(`
                    INSERT INTO Meals (UserID, Name, CreationDate, Calories, Protein, Fat, Fiber, TotalWeight)
                    OUTPUT inserted.MealID
                    VALUES (@userID, @mealName, @creationDate, @calories, @protein, @fat, @fiber, @totalWeight)
                `);

            mealID = mealResult.recordset[0].MealID;
        }

        // Insert new ingredients
        for (const ingredient of ingredients) {
            await pool.request()
                .input('mealID', sql.Int, mealID)
                .input('name', sql.NVarChar, ingredient.name)
                .input('weight', sql.Float, ingredient.weight)
                .input('energy', sql.Float, ingredient.nutritionalContent.energy)
                .input('protein', sql.Float, ingredient.nutritionalContent.protein)
                .input('fat', sql.Float, ingredient.nutritionalContent.fat)
                .input('fiber', sql.Float, ingredient.nutritionalContent.fiber)
                .query(`
                    INSERT INTO MealIngredients (MealID, Name, Weight, Energy, Protein, Fat, Fiber)
                    VALUES (@mealID, @name, @weight, @energy, @protein, @fat, @fiber)
                `);
        }

        res.status(200).json({ success: true, mealID: mealID });
    } catch (err) {
        console.error('Error saving meal:', err);
        res.status(500).json({ error: 'An error occurred while saving the meal.' });
    }
});

// Delete a meal
router.delete('/deleteMeal', async (req, res) => {
    const mealID = parseInt(req.query.mealID, 10);
    try {
        const pool = await getDbPool();

        // Delete ingredients first
        await pool.request()
            .input('mealID', sql.Int, mealID)
            .query(`
                DELETE FROM MealIngredients
                WHERE MealID = @mealID
            `);

        // Delete meal
        await pool.request()
            .input('mealID', sql.Int, mealID)
            .query(`
                DELETE FROM Meals
                WHERE MealID = @mealID
            `);

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error deleting meal:', err);
        res.status(500).json({ error: 'An error occurred while deleting the meal.' });
    }
});

module.exports = router;
