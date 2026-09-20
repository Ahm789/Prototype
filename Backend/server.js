const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

const productRoutes =
	require('./routes/products');


const app = express();

const PORT =
	process.env.PORT || 3000;


/* =========================================================
   TASK CLOCK
========================================================= */

let taskClockStart = Date.now();


/* GET TASK CLOCK */

app.get('/api/task-clock', (req, res) => {

	res.json({
		startTime: taskClockStart
	});

});


/* RESET TASK CLOCK */

app.post('/api/task-clock/reset', (req, res) => {

	taskClockStart = Date.now();

	res.json({
		startTime: taskClockStart
	});

});


/* ADVANCE TASK CLOCK BY ONE HOUR */

app.post(
	'/api/task-clock/advance-hour',
	(req, res) => {

		/*
			Move the server clock forward
			by exactly one hour.

			Moving the start time backwards
			means the calculated elapsed time
			increases by one hour.
		*/

		taskClockStart -=
			60 * 60 * 1000;


		res.json({
			startTime: taskClockStart
		});

	}
);


/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
	cors()
);

app.use(
	express.json()
);


/* =========================================================
   API ROUTES
========================================================= */

app.use(
	'/api/products',
	productRoutes
);


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get('/api/health', (req, res) => {

	res.json({
		status: 'ok',
		service: 'asda-inventory-api'
	});

});


/* =========================================================
   FRONTEND
========================================================= */

/*
	Backend is located in:

	../Backend/

	Frontend is located in:

	../frontend/

	Therefore ../frontend is the correct path
	from this server.js file.
*/

const frontendPath =
	path.join(__dirname, '../Frontend');


/* SERVE FRONTEND FILES */

app.use(
	express.static(frontendPath)
);


/* ROOT PAGE */

app.get('/', (req, res) => {

	res.sendFile(
		path.join(frontendPath, 'index.html')
	);

});


/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, () => {

	console.log(
		`Asda API running on port ${PORT}`
	);

});
app.get('/api/db-test', async (req, res) => {

	try {

		const pool = require('./db/pool');

		const result = await pool.query(
			'SELECT NOW() AS current_time'
		);

		res.json({
			status: 'ok',
			database: 'connected',
			time: result.rows[0].current_time
		});

	} catch (error) {

		console.error('Database test failed:', error);

		res.status(500).json({
			status: 'error',
			database: 'not connected',
			message: error.message
		});

	}

});