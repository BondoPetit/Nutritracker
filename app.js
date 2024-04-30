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

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Middleware for parsing JSON data

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/Login.html');
});

app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await sql.connect(config);
        const existingUser = await pool.request().query(`
            SELECT * FROM Users
            WHERE Email = '${email}'
        `);

        if (existingUser.recordset.length > 0) {
            res.json({ message: 'Brugeren eksisterer allerede.' });
        } else {
            await pool.request().query(`
                INSERT INTO Users (Email, PasswordHash)
                VALUES ('${email}', '${password}')
            `);
    
            res.json({ message: 'Bruger oprettet!' });
        }

        await sql.close();
    } catch (err) {
        console.error('Fejl under oprettelse af bruger:', err);
        res.status(500).json({ error: 'Der opstod en fejl under oprettelse af bruger.' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .query(`
                SELECT * FROM Users
                WHERE Email = @email AND PasswordHash = @password
            `);

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

app.listen(port, () => {
    console.log(`Serveren kører på http://localhost:${port}`);
});

app.use(express.static('public'));
