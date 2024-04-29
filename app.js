const express = require('express');
const sql = require('mssql');
const app = express();
const port = 3001;

// Configuration for the server and database
const config = {
    server: 'nutritrackerserverexam.database.windows.net',
    database: 'Login',
    user: 'Bondo',
    password: 'Pierre1969',
    options: {
        encrypt: true
    }
};

// Middleware to parse form submissions
app.use(express.urlencoded({ extended: true }));

// Route to serve the login page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Login.html');
});

// Route to handle user registration form submission
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Connect to the database
        const pool = await sql.connect(config);

        // Check if the user already exists
        const existingUser = await pool.request().query(`
            SELECT * FROM users
            WHERE Email = '${email}'
        `);

        // Check if the user already exists
        if (existingUser.recordset.length > 0) {
            res.send('Brugeren eksisterer allerede.');
        } else {
            // Create a new user in the database
            await pool.request().query(`
                INSERT INTO users (Email, Password)
                VALUES ('${email}', '${password}')
            `);
    
            res.send('Bruger oprettet!');
        }

        // Close the database connection
        await pool.close();
    } catch (err) {
        console.error('Fejl under oprettelse af bruger:', err);
        res.status(500).send('Der opstod en fejl under oprettelse af bruger.');
    }
});

// Route to handle user login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Connect to the database
        const pool = await sql.connect(config);

        // Check if the user exists and password matches
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .query(`
                SELECT * FROM users
                WHERE Email = @email
                AND Password = @password
            `);

        // Check if a user with matching credentials was found
        if (result.recordset.length > 0) {
            res.send('Velkommen ' + email + '! Du er logget ind.');
        } else {
            res.send('Ingen bruger fundet med de angivne oplysninger.');
        }

        // Close the database connection
        await pool.close();
    } catch (err) {
        console.error('Fejl under login:', err);
        res.status(500).send('Der opstod en fejl under login.');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Serveren kører på http://localhost:${port}`);
});
