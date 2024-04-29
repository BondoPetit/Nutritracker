const express = require('express');
const sql = require('mssql');
const app = express();
const port = 3000;

//konfiguration af server
const config = {
    server:'nutritrackerserverexam.database.windows.net',
    database:'NutriTracker',
    user: 'Bondo',
    password: 'Pierre1969',
    options: {
        encrypt:true
    }
};

async function connectToDatabase(){
    try {
        await sql.connect(config);
        console.log('Connected to database');
    } catch(err){
        console.err('Error connecting to database', err);
    }
}

connectToDatabase();

// Middleware til at analysere formularindsendelser
app.use(express.urlencoded({ extended: true }));

// Rute til startsiden
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

// Rute til behandling af formularindsendelse for oprettelse af bruger
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Opret forbindelse til databasen
        const pool = await sql.connect(config);

        // Udfør en SQL-forespørgsel for at kontrollere, om brugeren allerede findes
        const existingUser = await pool.request().query(`
            SELECT * FROM Users
            WHERE Email = '${email}'
        `);

        // Tjek om brugeren allerede eksisterer
        if (existingUser.recordset.length > 0) {
            res.send('Brugeren eksisterer allerede.');
        } else {
            // Opret en ny bruger i databasen
            await pool.request().query(`
                INSERT INTO Users (Email, PasswordHash)
                VALUES ('${email}', '${password}')
            `);
    
            res.send('Bruger oprettet!');
        }

        // Luk forbindelsen til databasen
        await sql.close();
    } catch (err) {
        console.error('Fejl under oprettelse af bruger:', err);
        res.status(500).send('Der opstod en fejl under oprettelse af bruger.');
    }
});

// Rute til behandling af login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Opret forbindelse til databasen
        const pool = await sql.connect(config);

        // Udfør en SQL-forespørgsel for at kontrollere, om brugeren findes i databasen
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .query(`
                SELECT * FROM Users
                WHERE Email = @email AND PasswordHash = @password
            `);

        // Tjek om der er nogen rækker i resultatet (hvis der er, findes brugeren)
        if (result.recordset.length > 0) {
            res.send('Velkommen ' + email + '! Du er logget ind.');
        } else {
            res.send('Ingen bruger fundet med de angivne oplysninger.');
        }

        // Luk forbindelsen til databasen
        await sql.close();
    } catch (err) {
        console.error('Fejl under login:', err);
        res.status(500).send('Der opstod en fejl under login.');
    }
});


// Start serveren
app.listen(port, () => {
    console.log(`Serveren kører på http://localhost:${port}`);
});
