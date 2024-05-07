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

        // Fetch basal metabolism
        const metabolismResult = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT BasalMetabolism 
                FROM BasalMetabolism 
                WHERE UserID = @userID
            `);
        const basalMetabolism = metabolismResult.recordset[0]?.BasalMetabolism || 0;
        const hourlyBasalMetabolism = basalMetabolism / 24;

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

        // Initialize hourly data for all 24 hours
        const hourlyData = {};
        for (let hour = 0; hour < 24; hour++) {
            hourlyData[hour] = {
                EnergyIntake: 0,
                WaterIntake: 0,
                Burning: hourlyBasalMetabolism,
                NetCalories: -hourlyBasalMetabolism
            };
        }

        mealIntakeResult.recordset.forEach(record => {
            hourlyData[record.Hour].EnergyIntake = record.EnergyIntake;
            hourlyData[record.Hour].WaterIntake = record.WaterIntake;
            hourlyData[record.Hour].NetCalories = record.EnergyIntake - hourlyBasalMetabolism;
        });

        activityResult.recordset.forEach(record => {
            hourlyData[record.Hour].Burning += record.Burning;
            hourlyData[record.Hour].NetCalories -= record.Burning;
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

        // Fetch basal metabolism
        const metabolismResult = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT BasalMetabolism 
                FROM BasalMetabolism 
                WHERE UserID = @userID
            `);
        const basalMetabolism = metabolismResult.recordset[0]?.BasalMetabolism || 0;
        const dailyBasalMetabolism = basalMetabolism;

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
                Burning: dailyBasalMetabolism,
                NetCalories: record.EnergyIntake - dailyBasalMetabolism
            };
        });

        activityResult.recordset.forEach(record => {
            if (!dailyData[record.Day]) {
                dailyData[record.Day] = {
                    EnergyIntake: 0,
                    WaterIntake: 0,
                    Burning: record.Burning + dailyBasalMetabolism,
                    NetCalories: -record.Burning - dailyBasalMetabolism
                };
            } else {
                dailyData[record.Day].Burning += record.Burning;
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
