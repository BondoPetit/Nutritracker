const express = require('express');
const sql = require('mssql');
const app = express();
const PORT = 3000;

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
