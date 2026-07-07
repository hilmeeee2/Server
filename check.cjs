const mysql = require('mysql2/promise');
async function check() {
  const connection = await mysql.createConnection('mysql://4W2CMgAo8hPpomX.root:3CGJJ5uW5cw4UWqO@gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}');
  const [rows] = await connection.execute('SHOW INDEX FROM chat_users');
  console.log(rows);
  await connection.end();
}
check();
