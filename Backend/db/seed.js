const pool = require('./pool');


/* =========================================================
   MODULAR DATA
========================================================= */

const products = [

	{
		upc: '9900000000011',
		aisle: '15',
		aisleSide: 'L',
		bay: '3',
		shelf: '1',
		modularId: 'FF-15-L-3'
	},

	{
		upc: '9900000000028',
		aisle: '15',
		aisleSide: 'L',
		bay: '3',
		shelf: '1',
		modularId: 'FF-15-L-3'
	},

	{
		upc: '9900000000035',
		aisle: '15',
		aisleSide: 'R',
		bay: '5',
		shelf: '',
		modularId: 'FF-15-R-5'
	},

	{
		upc: '9900000000042',
		aisle: '16',
		aisleSide: 'L',
		bay: '8',
		shelf: '1',
		modularId: 'FF-16-L-8'
	},

	{
		upc: '9900000000059',
		aisle: '16',
		aisleSide: 'L',
		bay: '8',
		shelf: '2',
		modularId: 'FF-16-L-8'
	},

	{
		upc: '9900000000066',
		aisle: '15',
		aisleSide: 'L',
		bay: '12',
		shelf: '',
		modularId: 'FF-15-L-12'
	},

	{
		upc: '9900000000073',
		aisle: '15',
		aisleSide: 'L',
		bay: '14',
		shelf: '',
		modularId: 'FF-15-L-14'
	},

	{
		upc: '9900000000080',
		aisle: '14',
		aisleSide: 'R',
		bay: '6',
		shelf: '',
		modularId: 'FF-14-R-6'
	},

	{
		upc: '9900000000097',
		aisle: '14',
		aisleSide: 'L',
		bay: '15',
		shelf: '',
		modularId: 'FF-14-L-15'
	},

	{
		upc: '9900000000103',
		aisle: '16',
		aisleSide: 'R',
		bay: '20',
		shelf: '',
		modularId: 'FF-16-R-20'
	},

	{
		upc: '9900000000110',
		aisle: '16',
		aisleSide: 'R',
		bay: '21',
		shelf: '1',
		modularId: 'FF-16-R-21'
	},

	{
		upc: '9900000000127',
		aisle: '14',
		aisleSide: 'L',
		bay: '18',
		shelf: '',
		modularId: 'FF-14-L-18'
	},

	{
		upc: '05060198649592',
		aisle: 'FF16',
		aisleSide: 'R',
		bay: '18',
		shelf: '2',
		modularId: 'FF-FF16-R-18-2'
	},

	{
		upc: '4001724008743',
		aisle: '16',
		aisleSide: 'R',
		bay: '15',
		shelf: '1',
		modularId: 'FF-16-R-15'
	}

];


/* =========================================================
   SALES HISTORY
   Chicago Town Subs
========================================================= */

const salesHistory = {

	'4001724008743': [

		{
			date: '2026-09-05',
			units: 4,
			availability: 100.00,
			sales: 7.60,
			lostSales: 0.00
		},

		{
			date: '2026-09-06',
			units: 3,
			availability: 100.00,
			sales: 5.70,
			lostSales: 0.00
		},

		{
			date: '2026-09-07',
			units: 5,
			availability: 100.00,
			sales: 9.50,
			lostSales: 0.00
		},

		{
			date: '2026-09-08',
			units: 2,
			availability: 99.80,
			sales: 3.80,
			lostSales: 0.00
		},

		{
			date: '2026-09-09',
			units: 4,
			availability: 100.00,
			sales: 7.60,
			lostSales: 0.00
		},

		{
			date: '2026-09-10',
			units: 3,
			availability: 99.90,
			sales: 5.70,
			lostSales: 0.00
		},

		{
			date: '2026-09-11',
			units: 4,
			availability: 100.00,
			sales: 7.60,
			lostSales: 0.00
		},

		{
			date: '2026-09-12',
			units: 3,
			availability: 99.70,
			sales: 5.70,
			lostSales: 0.00
		},

		{
			date: '2026-09-13',
			units: 6,
			availability: 100.00,
			sales: 3.78,
			lostSales: 0.00
		},

		{
			date: '2026-09-14',
			units: 5,
			availability: 98.19,
			sales: 7.50,
			lostSales: 0.00
		},

		{
			date: '2026-09-15',
			units: 4,
			availability: 99.00,
			sales: 6.00,
			lostSales: 0.00
		},

		{
			date: '2026-09-16',
			units: 6,
			availability: 98.70,
			sales: 9.00,
			lostSales: 0.00
		},

		{
			date: '2026-09-17',
			units: 3,
			availability: 98.50,
			sales: 4.50,
			lostSales: 0.00
		},

		{
			date: '2026-09-18',
			units: 5,
			availability: 98.40,
			sales: 7.50,
			lostSales: 0.00
		},

		{
			date: '2026-09-19',
			units: 5,
			availability: 98.90,
			sales: 7.50,
			lostSales: 0.00
		},

		{
			date: '2026-09-20',
			units: 7,
			availability: 99.00,
			sales: 10.50,
			lostSales: 1.90
		}

	]

};


/* =========================================================
   SEED
========================================================= */

async function seed() {

	const client = await pool.connect();

	try {

		await client.query('BEGIN');


		/* =====================================================
		   MODULAR LOCATIONS
		===================================================== */

		for (const product of products) {

			const itemResult = await client.query(
				`
				SELECT id
				FROM items
				WHERE upc = $1
				`,
				[
					product.upc
				]
			);


			if (!itemResult.rows.length) {

				console.warn(
					`Modular skipped: ${product.upc} was not found.`
				);

				continue;
			}


			const itemId =
				itemResult.rows[0].id;


			await client.query(
				`
				INSERT INTO modulars (
					item_id,
					aisle,
					aisle_side,
					bay,
					shelf,
					modular_id,
					is_primary
				)

				VALUES (
					$1,
					$2,
					$3,
					$4,
					$5,
					$6,
					$7
				)

				ON CONFLICT (
					item_id,
					modular_id
				)

				DO UPDATE SET

					aisle =
						EXCLUDED.aisle,

					aisle_side =
						EXCLUDED.aisle_side,

					bay =
						EXCLUDED.bay,

					shelf =
						EXCLUDED.shelf,

					is_primary =
						EXCLUDED.is_primary
				`,
				[
					itemId,
					product.aisle,
					product.aisleSide,
					product.bay,
					product.shelf,
					product.modularId,
					true
				]
			);

		}


		/* =====================================================
		   REMOVE SALES DATA OLDER THAN 28 DAYS
		===================================================== */

		await client.query(
			`
			DELETE FROM item_sales_daily

			WHERE sales_date <
				CURRENT_DATE - INTERVAL '27 days'
			`
		);


		/* =====================================================
		   SALES HISTORY
		===================================================== */

		for (
			const [upc, dailySales]
			of Object.entries(salesHistory)
		) {

			const itemResult = await client.query(
				`
				SELECT id
				FROM items
				WHERE upc = $1
				`,
				[
					upc
				]
			);


			if (!itemResult.rows.length) {

				console.warn(
					`Sales data skipped: ${upc} was not found.`
				);

				continue;
			}


			const itemId =
				itemResult.rows[0].id;


			for (const day of dailySales) {

				await client.query(
					`
					INSERT INTO item_sales_daily (
						item_id,
						sales_date,
						units_sold,
						availability_percent,
						sales_value,
						lost_sales
					)

					VALUES (
						$1,
						$2,
						$3,
						$4,
						$5,
						$6
					)

					ON CONFLICT (
						item_id,
						sales_date
					)

					DO UPDATE SET

						units_sold =
							EXCLUDED.units_sold,

						availability_percent =
							EXCLUDED.availability_percent,

						sales_value =
							EXCLUDED.sales_value,

						lost_sales =
							EXCLUDED.lost_sales,

						updated_at =
							CURRENT_TIMESTAMP
					`,
					[
						itemId,
						day.date,
						day.units,
						day.availability,
						day.sales,
						day.lostSales
					]
				);

			}

		}


		await client.query('COMMIT');


		console.log(
			`Seed complete: ${products.length} modulars processed.`
		);

		console.log(
			'Sales history seeded for Chicago Town Subs.'
		);


	} catch (error) {

		await client.query('ROLLBACK');

		console.error(
			'Seed failed:',
			error
		);

	} finally {

		client.release();

		await pool.end();

	}

}


seed();