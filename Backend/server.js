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
	If you put your frontend files inside:

	../frontend/

	the Express server can serve them too.
*/

app.use(
	express.static(
		path.join(__dirname, '../frontend')
	)
);



/* =========================================================
   START SERVER
   ========================================================= */

app.listen(PORT, () => {

	console.log(
		`Asda API running on http://localhost:${PORT}`
	);

});