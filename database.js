// Import the mssql module to interact with Microsoft SQL Server
const sql = require('mssql');

// Database configuration containing server address, database name, user credentials, and encryption options
const config = {
    server: 'eksamensprojekt2024.database.windows.net',
    database: 'Login',
    user: 'victoriapedersen',
    password: 'Vict4298',
    options: {
        encrypt: true // Enable encryption for secure communication
    }
};

let pool; // Declare a variable to store the connection pool

// Function to get the connection pool asynchronously
async function getPool() {
    // If connection pool doesn't exist, create a new one and return it
    if (!pool) {
        pool = await sql.connect(config);
    }
    // Return the connection pool
    return pool;
}

// Export the getPool function to make it accessible from other modules
module.exports = {
    getPool,
};
