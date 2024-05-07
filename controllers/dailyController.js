// dailyController.js
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

// Get nutritional data for the last 24 hours
router.get('/getDailyNutri24', async (req, res) => {
    const userID = parseInt(req.query.userID, 10);
    const endDateTime = new Date();
    const startDateTime = new Date();
    startDateTime.setHours(startDateTime.getHours() - 24);

    try {
        const pool = await getDbPool();

        // Fetch meal intake data
        const mealIntakeResult = await pool.request()
            .input('userID', sql.Int, userID)
            .input('startDateTime', sql.DateTime, startDateTime)
            .input('endDateTime', sql.DateTime, endDateTime)
            .query(`
                SELECT 
                    DATEPART(hour, IntakeTime) AS Hour,
                    SUM(Calories) AS EnergyIntake,
                    SUM(Weight) AS WaterIntake
                FROM MealIntakes
                WHERE UserID = @userID AND IntakeDate BETWEEN @startDateTime AND @endDateTime
                GROUP BY DATEPART(hour, IntakeTime)
            `);

        // Fetch activity data
        const activityResult = await pool.request()
            .input('userID', sql.Int, userID)
            .input('startDateTime', sql.DateTime, startDateTime)
            .input('endDateTime', sql.DateTime, endDateTime)
            .query(`
                SELECT 
                    DATEPART(hour, ActivityTime) AS Hour,
                    SUM(CaloriesBurned) AS Burning
                FROM Activities
                WHERE UserID = @userID AND ActivityDate BETWEEN @startDateTime AND @endDateTime
                GROUP BY DATEPART(hour, ActivityTime)
            `);

        // Merge results
        const hourlyData = {};
        mealIntakeResult.recordset.forEach(record => {
            hourlyData[record.Hour] = {
                EnergyIntake: record.EnergyIntake,
                WaterIntake: record.WaterIntake,
                Burning: 0,
                NetCalories: record.EnergyIntake
            };
        });

        activityResult.recordset.forEach(record => {
            if (!hourlyData[record.Hour]) {
                hourlyData[record.Hour] = {
                    EnergyIntake: 0,
                    WaterIntake: 0,
                    Burning: record.Burning,
                    NetCalories: -record.Burning
                };
            } else {
                hourlyData[record.Hour].Burning = record.Burning;
                hourlyData[record.Hour].NetCalories -= record.Burning;
            }
        });

        const result = Object.keys(hourlyData).map(hour => ({
            Hour: hour,
            ...hourlyData[hour]
        }));

        res.status(200).json(result);
    } catch (err) {
        console.error('Error fetching daily nutri data:', err);
        res.status(500).json({ error: 'An error occurred while fetching daily nutri data.' });
    }
});

// Get nutritional data for the last month (daily)
router.get('/getDailyNutriMonth', async (req, res) => {
    const userID = parseInt(req.query.userID, 10);

    try {
        const pool = await getDbPool();

        // Fetch meal intake data
        const mealIntakeResult = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT 
                    IntakeDate AS Day,
                    SUM(Calories) AS EnergyIntake,
                    SUM(Weight) AS WaterIntake
                FROM MealIntakes
                WHERE UserID = @userID AND IntakeDate >= DATEADD(day, -30, GETDATE())
                GROUP BY IntakeDate
            `);

        // Fetch activity data
        const activityResult = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT 
                    ActivityDate AS Day,
                    SUM(CaloriesBurned) AS Burning
                FROM Activities
                WHERE UserID = @userID AND ActivityDate >= DATEADD(day, -30, GETDATE())
                GROUP BY ActivityDate
            `);

        // Merge results
        const dailyData = {};
        mealIntakeResult.recordset.forEach(record => {
            dailyData[record.Day] = {
                EnergyIntake: record.EnergyIntake,
                WaterIntake: record.WaterIntake,
                Burning: 0,
                NetCalories: record.EnergyIntake
            };
        });

        activityResult.recordset.forEach(record => {
            if (!dailyData[record.Day]) {
                dailyData[record.Day] = {
                    EnergyIntake: 0,
                    WaterIntake: 0,
                    Burning: record.Burning,
                    NetCalories: -record.Burning
                };
            } else {
                dailyData[record.Day].Burning = record.Burning;
                dailyData[record.Day].NetCalories -= record.Burning;
            }
        });

        const result = Object.keys(dailyData).map(day => ({
            Day: day,
            ...dailyData[day]
        }));

        res.status(200).json(result);
    } catch (err) {
        console.error('Error fetching monthly nutri data:', err);
        res.status(500).json({ error: 'An error occurred while fetching monthly nutri data.' });
    }
});

module.exports = router;