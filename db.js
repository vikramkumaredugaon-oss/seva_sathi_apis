const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ DB Pool Error:", err);
  } else {
    console.log("✅ Database Pool Connected");
    connection.release(); 
  }
});

module.exports = db;
