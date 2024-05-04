const express = require('express');
const sql = require('mssql');
const path = require('path');
const mealController = require('./controllers/mealController');

const app = express();
const port = 3000;

const config = {
    server: 'eksamensprojekt2024.database.windows.net',
    database: 'Login',
    user: 'victoriapedersen',
    password: 'Vict4298',
    options: {
        encrypt: true
    }
};

// Middleware for parsing URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
// Middleware for parsing JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for serving the Login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'Login.html'));
});

// Route for handling user registration
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await sql.connect(config);

        // Insert new user into the database
        const registrationResult = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .query(`
                INSERT INTO Users (Email, PasswordHash)
                OUTPUT inserted.UserID
                VALUES (@{email}, @{password})
            `);

        const userID = registrationResult.recordset[0].UserID;

        // Redirect to MyProfile.html upon successful registration
        res.redirect(`/MyProfile.html?userID=${userID}`);
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ error: 'An error occurred while registering user.' });
    } finally {
        await sql.close();
    }
});

// Route to update user data
app.post('/updateUserData', async (req, res) => {
    const { userID, height, weight, age, gender } = req.body;

    try {
        const pool = await sql.connect(config);

        // Fetch UserID from Users table based on provided userID
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

        // Update user's data (Height, Weight, Age, Gender) in UserDetails table
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
    } finally {
        await sql.close();
    }
});

// Route for handling user login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await sql.connect(config);

        // Check if user credentials are valid
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .query(`
                SELECT UserID
                FROM Users
                WHERE Email = @email AND PasswordHash = @password
            `);

        if (result.recordset.length > 0) {
            const userID = result.recordset[0].UserID;
            // Redirect to MealCreator.html upon successful login
            res.redirect(`/MealCreator.html?userID=${userID}`);
        } else {
            res.status(401).json({ message: 'Invalid credentials.' });
        }
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ error: 'An error occurred while logging in.' });
    } finally {
        await sql.close();
    }
});

// Route for serving MyProfile page
app.get('/MyProfile.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'MyProfile.html'));
});

// Route for handling user body data submission
app.post('/submit-body-data', async (req, res) => {
    const { userID, height, weight, age, gender } = req.body;

    try {
        const pool = await sql.connect(config);

        // Insert height, weight, age, and gender data into UserDetails table
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

        // Redirect to MealCreator.html upon successful data submission
        res.redirect(`/MealCreator.html?userID=${userID}`);
    } catch (err) {
        console.error('Error submitting body data:', err);
        res.status(500).json({ error: 'An error occurred while submitting body data.' });
    } finally {
        await sql.close();
    }
});

// Route for serving MyStats page
app.get('/MyStats.html', async (req, res) => {
    const userID = req.query.userID;

    try {
        const pool = await sql.connect(config);

        // Fetch user's data (Email, Height, Weight, Age, Gender) based on userID
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
            // Send MyStats.html as response
            res.sendFile(path.join(__dirname, 'views', 'MyStats.html'));
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        console.error('Error fetching user data:', err);
        res.status(500).send('An error occurred while fetching user data');
    } finally {
        await sql.close();
    }
});

// Route to fetch user data based on userID
app.get('/getUserData', async (req, res) => {
    const userID = req.query.userID;

    try {
        const pool = await sql.connect(config);

        // Fetch user's data (Email, Height, Weight, Age, Gender) based on userID
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
            res.json(userData); // Send user data as JSON response
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        console.error('Error fetching user data:', err);
        res.status(500).send('An error occurred while fetching user data');
    } finally {
        await sql.close();
    }
});

// Route to delete user account and associated data
app.delete('/deleteUser', async (req, res) => {
    const { userID } = req.query;

    try {
        const pool = await sql.connect(config);

        // Delete user from UserDetails table
        await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                DELETE FROM UserDetails
                WHERE UserID = @userID
            `);

        // Delete user from Users table
        await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                DELETE FROM Users
                WHERE UserID = @userID
            `);

        res.sendStatus(200); // Send success response after deletion
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).send('Failed to delete user');
    } finally {
        await sql.close();
    }
});

// Use the meal controller for meal-related routes
app.use('/api', mealController);

app.get('/MealCreator.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'MealCreator.html'));
});

// Route for serving MealTracker.html
app.get('/MealTracker.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'MealTracker.html'));
});

// Route for serving Activity.html
app.get('/Activity.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'Activity.html'));
});

// Route for serving DailyNutri.html
app.get('/DailyNutri.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'DailyNutri.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
