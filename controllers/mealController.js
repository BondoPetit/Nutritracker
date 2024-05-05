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

// Shared connection pool
let poolPromise = null;

async function getPool() {
    if (!poolPromise) {
        poolPromise = sql.connect(config);
    }
    return poolPromise;
}

router.get('/getMeals', async (req, res) => {
    const userID = parseInt(req.query.userID, 10);
    let pool;
    try {
        pool = await getPool();
        const mealResults = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT MealID, UserID, Name, CreationDate, Calories, Protein, Fats, Fiber, TotalWeight
                FROM Meals
                WHERE UserID = @userID
            `);

        const ingredientResults = await pool.request()
            .query(`
                SELECT IngredientID, MealID, Name, Weight, Energy, Protein, Fat, Fiber
                FROM MealIngredients
            `);

        const meals = mealResults.recordset;
        const ingredients = ingredientResults.recordset;

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

router.get('/getMeal', async (req, res) => {
    const mealID = parseInt(req.query.id, 10);
    let pool;
    try {
        pool = await getPool();
        const mealResult = await pool.request()
            .input('mealID', sql.Int, mealID)
            .query(`
                SELECT MealID, UserID, Name, CreationDate, Calories, Protein, Fats, Fiber, TotalWeight
                FROM Meals
                WHERE MealID = @mealID
            `);

        const ingredientResult = await pool.request()
            .input('mealID', sql.Int, mealID)
            .query(`
                SELECT IngredientID, MealID, Name, Weight, Energy, Protein, Fat, Fiber
                FROM MealIngredients
                WHERE MealID = @mealID
            `);

        if (mealResult.recordset.length === 0) {
            res.status(404).json({ error: 'Meal not found' });
            return;
        }

        const meal = mealResult.recordset[0];
        meal.ingredients = ingredientResult.recordset;
        res.status(200).json(meal);
    } catch (err) {
        console.error('Error fetching meal:', err);
        res.status(500).json({ error: 'An error occurred while fetching meal.' });
    }
});

router.post('/saveMeal', async (req, res) => {
    const { userID, mealName, creationDate, ingredients, nutritionalData } = req.body;
    let pool;
    try {
        pool = await getPool();

        const mealResult = await pool.request()
            .input('userID', sql.Int, userID)
            .input('mealName', sql.NVarChar, mealName)
            .input('creationDate', sql.Date, creationDate)
            .input('calories', sql.Float, nutritionalData.calories)
            .input('protein', sql.Float, nutritionalData.protein)
            .input('fats', sql.Float, nutritionalData.fats)
            .input('fiber', sql.Float, nutritionalData.fiber)
            .input('totalWeight', sql.Float, nutritionalData.totalWeight)
            .query(`
                INSERT INTO Meals (UserID, Name, CreationDate, Calories, Protein, Fats, Fiber, TotalWeight)
                OUTPUT inserted.MealID
                VALUES (@userID, @mealName, @creationDate, @calories, @protein, @fats, @fiber, @totalWeight)
            `);

        const mealID = mealResult.recordset[0].MealID;

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

module.exports = router;
