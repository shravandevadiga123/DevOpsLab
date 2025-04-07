const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',  // XAMPP MySQL runs on localhost
    user: 'root',       // Default MySQL user in XAMPP
    password: '',       // Leave empty if no password is set
    database: 'meeting_room_booking', // Ensure this is the correct database
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise(); // Export with promises for async/await
