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