const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'host.docker.internal', // For Docker on Windows/macOS
    user: 'root',
    password: '', // Leave empty if no password is set
    database: 'meeting_room_booking',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();
