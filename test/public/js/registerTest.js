const assert = require('assert');
const request = require('supertest');
const express = require('express');
const sql = require('mssql');  
const loginController = require('../../../controllers/loginController');

const app = express();
app.use(express.json());
app.use('/', loginController);

const pool = new sql.ConnectionPool({
    server: 'eksamensprojekt2024.database.windows.net',
    database: 'Login',
    user: 'victoriapedersen',
    password: 'Vict4298',
    options: { encrypt: true }
});

const poolConnect = pool.connect();

describe('Authentication', function() {
    this.timeout(10000); // Increase timeout for all tests in this suite to 10 seconds

    let testUser;
    let transaction;

    beforeEach(async function() {
        await poolConnect;
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        testUser = {
            email: `test_${Date.now()}@example.com`,
            password: 'password123'
        };

        const request = new sql.Request(transaction);
        await request
            .input('email', sql.NVarChar, testUser.email)
            .input('password', sql.NVarChar, testUser.password)
            .query('INSERT INTO Users (Email, PasswordHash) VALUES (@email, @password)');
    });

    afterEach(async function() {
        await transaction.rollback();
    });

    after(async () => {
        await pool.close();
    });

    describe('Register', function() {
        it('should allow a user to create a profile', async function() {
            const response = await request(app)
                .post('/register')
                .send(testUser);

            assert.strictEqual(response.status, 302);
            assert.ok(response.headers['location'].match(/MyProfile\.html\?userID=\d+/), 'Redirect to profile page with userID');
        });
    });

    describe('Login', function() {
        it('should authenticate a user with correct credentials', async function() {
            const response = await request(app)
                .post('/login')
                .send(testUser);

            assert.strictEqual(response.status, 302);
            assert.ok(response.headers['location'].match(/MealCreator\.html\?userID=\d+/), 'Redirect to meal creator page with userID');
        });

        it('should reject a login attempt with incorrect credentials', async function() {
            const response = await request(app)
                .post('/login')
                .send({
                    email: testUser.email,
                    password: 'incorrectpassword'
                });

            assert.strictEqual(response.status, 401);
            assert.strictEqual(response.body.message, 'Invalid credentials.');
        });

        it('should handle errors during login attempts', async function() {
            const response = await request(app)
                .post('/login')
                .send({});

            assert.strictEqual(response.status, 500);
            assert.ok(response.body.error.includes('An error occurred while logging in'), 'Check error message for login failure');
        });
    });
});
