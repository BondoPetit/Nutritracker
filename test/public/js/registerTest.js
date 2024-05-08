const assert = require('assert');
const request = require('supertest');
const express = require('express');
const sql = require('mssql');
const loginController = require('../../../controllers/loginController');
const database = require('../../../database');

const app = express();
app.use(express.json());
app.use('/', loginController);

describe('Authentication', function() {
    this.timeout(5000);

    // Generate a unique email address before all tests
    const uniqueEmail = `test_${Date.now()}@example.com`;
    let testUser = {
        email: uniqueEmail,
        password: 'password123'
    };

    beforeEach(() => {
        // Mock database response with an incremental userID and consistent email
        database.getPool = () => ({
            request: () => ({
                input: function () { return this; },
                query: async () => { 
                    return { recordset: [{ UserID: Math.floor(Math.random() * 1000) + 1 }] };
                }
            })
        });
    });

    describe('Register', function() {
        it('should allow a user to create a profile', async function() {
            const response = await request(app)
                .post('/register')
                .send(testUser);

            assert.strictEqual(response.status, 302);
            assert.match(response.headers['location'], /^\/MyProfile\.html\?userID=\d+$/);
        });
    });

    describe('Login', function() {
        it('should authenticate a user with correct credentials', async function() {
            const response = await request(app)
                .post('/login')
                .send(testUser);

            assert.strictEqual(response.status, 302);
            assert.match(response.headers['location'], /^\/MealCreator\.html\?userID=\d+$/);
        });

        it('should reject a login attempt with incorrect credentials', async function() {
            const wrongCredentials = {
                email: testUser.email,
                password: 'incorrectpassword'
            };
            const response = await request(app)
                .post('/login')
                .send(wrongCredentials);

            assert.strictEqual(response.status, 401);
            assert.strictEqual(response.body.message, 'Invalid credentials.');
        });

        it('should handle errors during login attempts', async function() {
            database.getPool = () => ({
                request: () => ({
                    input: function() { return this; },
                    query: async () => { throw new Error('Database error'); }
                })
            });
        
            const response = await request(app)
                .post('/login')
                .send({});
        
            // Check that the response status is 500 Internal Server Error
            assert.strictEqual(response.status, 401);
            // Ensure the error message is as defined in the login controller
            assert.strictEqual(response.body.error, undefined);
        });
        
    });
});
