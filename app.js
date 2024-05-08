const express = require('express');
const sql = require('mssql');
const path = require('path');
const mealController = require('./controllers/mealController');
const trackerController = require('./controllers/trackerController');
const activityController = require('./controllers/activityController');
const dailyController = require('./controllers/dailyController');
const loginController = require('./controllers/loginController');
const myProfileController = require('./controllers/myProfileController');
const statsController = require('./controllers/statsController'); // Import the new stats controller

const app = express();
const port = 3000;

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Serve static files from 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Additionally serve static HTML files from 'views'
app.use(express.static(path.join(__dirname, 'views')));

// Route to serve the Login page at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'Login.html')); // Adjust the directory as necessary
});


// Use controllers
app.use(loginController);
app.use(myProfileController);
app.use('/api', mealController);
app.use('/api', trackerController);
app.use('/api', activityController);
app.use('/api', dailyController);
app.use('/api', statsController); // Use the stats controller for user statistics and profile management

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}/`);
});
