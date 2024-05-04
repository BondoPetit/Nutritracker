const express = require('express');
const sql = require('mssql');

const config = {
    server: 'eksamensprojekt2024.database.windows.net',
    database: 'Login',
    user: 'victoriapedersen',
    password: 'Vict4298',
    options: {
        encrypt: true
    }
};

const router = express.Router();

// POST /meals to create a new meal
router.post('/meals', async (req, res) => {
    const { userID, mealName, ingredients } = req.body;
    const dateCreated = new Date().toISOString().split('T')[0];
    try {
        const pool = await sql.connect(config);

        // Calculate nutritional values for the meal
        let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
        for (const ingredient of ingredients) {
            totalCalories += ingredient.calories;
            totalProtein += ingredient.protein;
            totalCarbs += ingredient.carbs;
            totalFat += ingredient.fat;
        }

        // Insert the meal into Meals table
        const result = await pool.request()
            .input('userID', sql.Int, userID)
            .input('mealName', sql.NVarChar, mealName)
            .input('ingredients', sql.NVarChar, JSON.stringify(ingredients))
            .input('calories', sql.Float, totalCalories)
            .input('protein', sql.Float, totalProtein)
            .input('carbs', sql.Float, totalCarbs)
            .input('fat', sql.Float, totalFat)
            .input('dateCreated', sql.Date, dateCreated)
            .query(`
                INSERT INTO Meals (UserID, MealName, Ingredients, Calories, Protein, Carbs, Fat, DateCreated)
                OUTPUT INSERTED.MealID
                VALUES (@userID, @mealName, @ingredients, @calories, @protein, @carbs, @fat, @dateCreated)
            `);
        const mealID = result.recordset[0].MealID;

        // Insert ingredients into MealIngredients table
        for (const ingredient of ingredients) {
            await pool.request()
                .input('mealID', sql.Int, mealID)
                .input('foodID', sql.Int, ingredient.foodID)
                .input('calories', sql.Float, ingredient.calories)
                .input('protein', sql.Float, ingredient.protein)
                .input('carbs', sql.Float, ingredient.carbs)
                .input('fat', sql.Float, ingredient.fat)
                .query(`
                    INSERT INTO MealIngredients (MealID, FoodID, Calories, Protein, Carbs, Fat)
                    VALUES (@mealID, @foodID, @calories, @protein, @carbs, @fat)
                `);
        }

        res.status(201).json({ mealID });
    } catch (err) {
        console.error('Error creating meal:', err);
        res.status(500).json({ error: 'An error occurred while creating meal.' });
    }
});

// GET /meals to fetch all meals
router.get('/meals', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT m.MealID, m.MealName, m.DateCreated, m.Calories, m.Protein, m.Carbs, m.Fat, i.FoodID, i.Calories AS IngredientCalories, 
                   i.Protein AS IngredientProtein, i.Carbs AS IngredientCarbs, i.Fat AS IngredientFat
            FROM Meals m
            INNER JOIN MealIngredients i ON m.MealID = i.MealID
        `);
        const meals = result.recordset.reduce((acc, row) => {
            const mealID = row.MealID;
            if (!acc[mealID]) {
                acc[mealID] = {
                    mealID,
                    mealName: row.MealName,
                    creationDate: row.DateCreated,
                    calories: row.Calories,
                    protein: row.Protein,
                    carbs: row.Carbs,
                    fat: row.Fat,
                    ingredients: []
                };
            }
            acc[mealID].ingredients.push({
                foodID: row.FoodID,
                calories: row.IngredientCalories,
                protein: row.IngredientProtein,
                carbs: row.IngredientCarbs,
                fat: row.IngredientFat
            });
            return acc;
        }, {});
        res.status(200).json(Object.values(meals));
    } catch (err) {
        console.error('Error fetching meals:', err);
        res.status(500).json({ error: 'An error occurred while fetching meals.' });
    }
});

// PUT /meals/:id to update a meal
router.put('/meals/:id', async (req, res) => {
    const mealID = req.params.id;
    const { mealName, ingredients } = req.body;
    try {
        const pool = await sql.connect(config);

        // Calculate nutritional values for the meal
        let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
        for (const ingredient of ingredients) {
            totalCalories += ingredient.calories;
            totalProtein += ingredient.protein;
            totalCarbs += ingredient.carbs;
            totalFat += ingredient.fat;
        }

        await pool.request()
            .input('mealID', sql.Int, mealID)
            .input('mealName', sql.NVarChar, mealName)
            .input('calories', sql.Float, totalCalories)
            .input('protein', sql.Float, totalProtein)
            .input('carbs', sql.Float, totalCarbs)
            .input('fat', sql.Float, totalFat)
            .query(`
                UPDATE Meals
                SET MealName = @mealName, Calories = @calories, Protein = @protein, Carbs = @carbs, Fat = @fat
                WHERE MealID = @mealID
            `);

        await pool.request().query(`
            DELETE FROM MealIngredients
            WHERE MealID = ${mealID}
        `);

        for (const ingredient of ingredients) {
            await pool.request()
                .input('mealID', sql.Int, mealID)
                .input('foodID', sql.Int, ingredient.foodID)
                .input('calories', sql.Float, ingredient.calories)
                .input('protein', sql.Float, ingredient.protein)
                .input('carbs', sql.Float, ingredient.carbs)
                .input('fat', sql.Float, ingredient.fat)
                .query(`
                    INSERT INTO MealIngredients (MealID, FoodID, Calories, Protein, Carbs, Fat)
                    VALUES (@mealID, @foodID, @calories, @protein, @carbs, @fat)
                `);
        }

        res.status(200).send('Meal updated successfully');
    } catch (err) {
        console.error('Error updating meal:', err);
        res.status(500).json({ error: 'An error occurred while updating meal.' });
    }
});

// DELETE /meals/:id to delete a meal
router.delete('/meals/:id', async (req, res) => {
    const mealID = req.params.id;
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('mealID', sql.Int, mealID)
            .query(`
                DELETE FROM MealIngredients
                WHERE MealID = @mealID
            `);
        await pool.request()
            .input('mealID', sql.Int, mealID)
            .query(`
                DELETE FROM Meals
                WHERE MealID = @mealID
            `);
        res.status(200).send('Meal deleted successfully');
    } catch (err) {
        console.error('Error deleting meal:', err);
        res.status(500).json({ error: 'An error occurred while deleting meal.' });
    }
});

module.exports = router;
