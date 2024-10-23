// Import required packages
const express = require('express'); // Express framework for creating the server
const sql = require('mssql'); // SQL server module for database interaction
const path = require('path'); // Path module for handling file paths
const http = require('http'); // HTTP module for pinger

// Import controllers for various application functionalities
const mealController = require('./controllers/mealController');
const trackerController = require('./controllers/trackerController');
const activityController = require('./controllers/activityController');
const dailyController = require('./controllers/dailyController');
const loginController = require('./controllers/loginController');
const myProfileController = require('./controllers/myProfileController');
const statsController = require('./controllers/statsController');

// Create an Express application instance
const app = express();

// Define the port number for the server to listen on
const port = 3000;

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));

// Route to serve the Login page at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'Login.html')); // Adjust the directory as necessary
});

// Use controllers to handle different API routes
app.use(loginController);
app.use(myProfileController);
app.use('/api', mealController);
app.use('/api', trackerController);
app.use('/api', activityController);
app.use('/api', dailyController);
app.use('/api', statsController);

// Pinger function to measure RTT
async function measureRTT() {
    const startTime = Date.now(); // Starttidspunkt for anmodning (RTT)

    try {
        const response = await new Promise((resolve, reject) => {
            const req = http.get('http://localhost:3000', (res) => {
                const responseTime = Date.now(); // Tidspunkt for modtagelse af svar fra serveren (responstid)
                resolve(res);
            });
            
            req.on('response', () => {
                const responseTime = Date.now(); // Tidspunktet hvor serveren begynder at svare
                const responstid = responseTime - startTime;
                console.log(`Responstid: ${responstid} ms`);
            });

            req.on('error', (err) => {
                reject(err);
            });
        });

        const RTT = Date.now() - startTime; // Beregn RTT
        console.log(`RTT: ${RTT} ms`);

    } catch (error) {
        console.error('Error measuring RTT and Responstid:', error);
    }
}

// Kør pinger-funktionen hvert 5. sekund for at måle RTT og responstid
setInterval(measureRTT, 5000);


// Start the server and listen on the specified port
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}/`);
});
