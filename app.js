const express = require('express');
const sql = require('mssql');
const path = require('path');

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
        const registrationResult = await pool.request().query(`
            INSERT INTO Users (Email, PasswordHash)
            OUTPUT inserted.UserID
            VALUES ('${email}', '${password}')
        `);

        const userID = registrationResult.recordset[0].UserID;

        // Redirect to MyProfile.html upon successful registration
        res.redirect(`/MyProfile.html?userID=${userID}`);

        await sql.close();
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ error: 'An error occurred while registering user.' });
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

        await sql.close();
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ error: 'An error occurred while logging in.' });
    }
});

// Route for serving the MyProfile page
app.get('/MyProfile.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'MyProfile.html'));
});

// Route for handling user body data submission
app.post('/submit-body-data', async (req, res) => {
    const { userID, height, weight } = req.body;

    try {
        const pool = await sql.connect(config);

        // Insert height and weight data into UserDetails table
        await pool.request().query(`
            INSERT INTO UserDetails (UserID, Height, Weight)
            VALUES (${userID}, ${height}, ${weight})
        `);

        // Redirect to MyProfile.html upon successful data submission
        res.redirect(`/MealCreator.html?userID=${userID}`);

        await sql.close();
    } catch (err) {
        console.error('Error submitting body data:', err);
        res.status(500).json({ error: 'An error occurred while submitting body data.' });
    }
});

// Route for serving the MyStats page
app.get('/MyStats.html', async (req, res) => {
    const userID = req.query.userID; // Assuming userID is passed as a query parameter

    try {
        const pool = await sql.connect(config);

        // Fetch user's details from the database
        const result = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT Email, Height, Weight
                FROM Users
                INNER JOIN UserDetails ON Users.UserID = UserDetails.UserID
                WHERE Users.UserID = @userID
            `);

        if (result.recordset.length > 0) {
            const userData = result.recordset[0];
            res.sendFile(path.join(__dirname, 'views', 'MyStats.html')); // Send MyStats.html file
        } else {
            res.status(404).send('User not found');
        }

        await sql.close();
    } catch (err) {
        console.error('Error fetching user details:', err);
        res.status(500).send('An error occurred while fetching user details');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
