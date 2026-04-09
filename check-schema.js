const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../osticket_middleware/.env' });

async function checkUserSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [rows] = await connection.query('DESCRIBE ost_user');
  console.table(rows);

  const [rows2] = await connection.query('DESCRIBE ost_user_account');
  console.table(rows2);

  await connection.end();
}

checkUserSchema().catch(console.error);
