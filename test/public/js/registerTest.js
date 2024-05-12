// Import necessary modules
const assert = require('assert');
const request = require('supertest');
const express = require('express');
const sql = require('mssql');
const loginController = require('../../../controllers/loginController'); // Import login controller
const database = require('../../../database'); // Import database module

// Create an Express application
const app = express();
app.use(express.json()); // Middleware to parse JSON requests
app.use('/', loginController); // Use the login controller for routes

// Describe block for authentication tests
describe('Authentication', function() {
    this.timeout(5000); // Set timeout for tests

    // Generate a unique email address before all tests
    const uniqueEmail = `test_${Date.now()}@example.com`;
    let testUser = {
        email: uniqueEmail,
        password: 'password123'
    };

    // Before each test, mock the database response
    beforeEach(() => {
        database.getPool = () => ({
            request: () => ({
                input: function () { return this; },
                query: async () => { 
                    return { recordset: [{ UserID: Math.floor(Math.random() * 1000) + 1 }] };
                }
            })
        });
    });

    // Describe block for registration tests
    describe('Register', function() {
        // Test to verify user registration
        it('should allow a user to create a profile', async function() {
            const response = await request(app)
                .post('/register')
                .send(testUser);

            // Assert status code and redirect location
            assert.strictEqual(response.status, 302);
            assert.match(response.headers['location'], /^\/MyProfile\.html\?userID=\d+$/);
        });
    });

    // Describe block for login tests
    describe('Login', function() {
        // Test to verify successful login
        it('should authenticate a user with correct credentials', async function() {
            const response = await request(app)
                .post('/login')
                .send(testUser);

            // Assert status code and redirect location
            assert.strictEqual(response.status, 302);
            assert.match(response.headers['location'], /^\/MealCreator\.html\?userID=\d+$/);
        });

        // Test to reject login with wrong email
        it('should reject a login attempt with a wrong email but correct password', async function() {
            const wrongEmailCredentials = {
                email: 'wrong_' + uniqueEmail,
                password: testUser.password
            };
            const response = await request(app)
                .post('/login')
                .send(wrongEmailCredentials);

            // Assert status code and error message
            assert.strictEqual(response.status, 401);
            assert.strictEqual(response.body.message, 'Invalid credentials.');
        });

        // Test to reject login with wrong password
        it('should reject a login attempt with correct email but wrong password', async function() {
            const wrongPasswordCredentials = {
                email: testUser.email,
                password: 'wrongpassword123'
            };
            const response = await request(app)
                .post('/login')
                .send(wrongPasswordCredentials);

            // Assert status code and error message
            assert.strictEqual(response.status, 401);
            assert.strictEqual(response.body.message, 'Invalid credentials.');
        });

        // Test error handling during login attempts
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
        
            // Assert status code for error handling
            assert.strictEqual(response.status, 401);
        });
        
    });
});
