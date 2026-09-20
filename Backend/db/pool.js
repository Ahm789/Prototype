const { Pool } = require('pg');

require('dotenv').config();

const poolConfig = process.env.DATABASE_URL
	? {
			connectionString: process.env.DATABASE_URL,
			ssl: {
				rejectUnauthorized: false
			}
		}
	: {
			host: process.env.DB_HOST,
			port: process.env.DB_PORT || 5432,
			database: process.env.DB_NAME,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD
		};

const pool = new Pool(poolConfig);

pool.on('error', (error) => {
	console.error('Unexpected PostgreSQL error:', error);
});

module.exports = pool;