// const mysql = require("mysql2");
// const db = mysql.createConnection({ host: "217.21.87.103", database: "u205680228_sevasathi", user: "u205680228_seva_sathi", password: "Seva@sathi2026" });
// db.connect((error) => {
//     if (error) {
//         console.log("Database Connection Error:-" + error);
//     }
//     else {
//         console.log("Database Connected");
//     }
// })
// module.exports = db;


const mysql = require("mysql2");


// ✅ CONNECTION POOL
const db = mysql.createPool({
  host: "217.21.87.103",
  user: "u205680228_seva_sathi",
  password: "Seva@sathi2026",
  database: "u205680228_sevasathi",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ DB Pool Error:", err);
  } else {
    console.log("✅ Database Pool Connected");
    connection.release(); // VERY IMPORTANT
  }
});

module.exports = db;
