// Import required packages
const express = require('express'); // Express framework for creating the server
const sql = require('mssql'); // SQL server module for database interaction
const path = require('path'); // Path module for handling file paths

// Import controllers for various application functionalities
const mealController = require('./controllers/mealController'); // Controller for handling meal-related operations
const trackerController = require('./controllers/trackerController'); // Controller for handling tracker-related operations
const activityController = require('./controllers/activityController'); // Controller for handling activity-related operations
const dailyController = require('./controllers/dailyController'); // Controller for handling daily nutrition-related operations
const loginController = require('./controllers/loginController'); // Controller for handling login-related operations
const myProfileController = require('./controllers/myProfileController'); // Controller for handling user profile-related operations
const statsController = require('./controllers/statsController'); // Controller for handling user statistics-related operations

// Create an Express application instance
const app = express();

// Define the port number for the server to listen on
const port = 3000;

// Middleware setup
// Parse incoming requests with URL-encoded and JSON payloads
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Additionally serve static HTML files from the 'views' directory
app.use(express.static(path.join(__dirname, 'views')));

// Route to serve the Login page at the root URL
app.get('/', (req, res) => {
    // Send the Login.html file located in the 'views' directory
    res.sendFile(path.join(__dirname, 'views', 'Login.html')); // Adjust the directory as necessary
});

// Use controllers to handle different API routes
// Each controller is responsible for a specific set of functionalities
app.use(loginController); // Handles login-related routes
app.use(myProfileController); // Handles user profile-related routes
app.use('/api', mealController); // Handles meal-related API routes
app.use('/api', trackerController); // Handles tracker-related API routes
app.use('/api', activityController); // Handles activity-related API routes
app.use('/api', dailyController); // Handles daily nutrition-related API routes
app.use('/api', statsController); // Handles user statistics-related API routes

// Start the server and listen on the specified port
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}/`);
});
