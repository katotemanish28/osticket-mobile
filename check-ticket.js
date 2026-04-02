const mysql = require('mysql2/promise');

async function checkLatestTicket() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'osticket_user',
    password: 'Manish@280324',
    database: 'osticket'
  });

  const [tickets] = await connection.query('SELECT * FROM ost_ticket ORDER BY created DESC LIMIT 1');
  console.log('Latest ticket:', tickets[0]);
  
  if (tickets[0]) {
    const [cdata] = await connection.query('SELECT * FROM ost_ticket__cdata WHERE ticket_id = ?', [tickets[0].ticket_id]);
    console.log('CDATA:', cdata[0]);
  }

  // Find priority ID 1 
  const [p] = await connection.query('SELECT * FROM ost_ticket_priority WHERE priority_id=1');
  console.log('Priority 1:', p[0]);

  await connection.end();
}
checkLatestTicket().catch(console.error);
