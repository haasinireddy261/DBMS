const oracledb = require('oracledb');
require('dotenv').config({ path: __dirname + '/.env' });

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING
};

async function getConnection() {
  try {
    const connection = await oracledb.getConnection(config);
    return connection;
  } catch (error) {
    console.error('Database connection error:', error.message);
    throw error;
  }
}

module.exports = {
  getConnection
};
