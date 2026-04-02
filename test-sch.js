const mysql = require('mysql2/promise');

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'osticket_user',
    password: 'Manish@280324',
    database: 'osticket'
  });

  const query = async (sql) => {
    try {
      const [rows] = await connection.query(sql);
      console.log(sql);
      console.table(rows.slice(0, 5));
    } catch (e) {
      console.error(sql, e.message);
    }
  };

  await query('SELECT priority_id, priority FROM ost_ticket_priority');
  await query('SELECT topic_id, topic FROM ost_help_topic');

  await connection.end();
}

checkSchema().catch(console.error);
