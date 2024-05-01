const express = require('express');
const sql = require('mssql');

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
app.use(express.static('public'));

// Serve static files from the 'views' directory
app.use(express.static('views'));

// Route for serving the Login page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/Login.html');
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
        console.error('Fejl under oprettelse af bruger:', err);
        res.status(500).json({ error: 'Der opstod en fejl under oprettelse af bruger.' });
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
            .query(`SELECT * FROM Users WHERE Email = @email AND PasswordHash = @password`);


        if (result.recordset.length > 0) {
            res.json({ message: 'Velkommen ' + email + '! Du er logget ind.' });
        } else {
            res.json({ message: 'Ingen bruger fundet med de angivne oplysninger.' });
        }

        await sql.close();
    } catch (err) {
        console.error('Fejl under login:', err);
        res.status(500).json({ error: 'Der opstod en fejl under login.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Serveren kører på http://localhost:${port}`);
});


// Route for serving the MyBody page
app.get('/MyProfile.html', (req, res) => {
    res.sendFile(__dirname + '/views/MyProfile.html');
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
        res.redirect(`/MyProfile.html?userID=${userID}`);

        await sql.close();
    } catch (err) {
        console.error('Error submitting body data:', err);
        res.status(500).json({ error: 'An error occurred while submitting body data.' });
    }
});

