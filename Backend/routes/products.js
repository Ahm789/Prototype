const express = require('express');
const pool = require('../db/pool');

const router = express.Router();



/* =========================================================
   FORMAT DATABASE ITEM
========================================================= */

const formatItem = (row) => {

	return {
		upc: row.upc,

		caseBarcode: row.case_barcode,

		alternativeBarcode: row.alternative_barcode,

		hffssStatus: row.hffss_status,

		description: row.description,

		department: row.department,

		onHand: row.on_hand,

		price: Number(row.price),

		caseSize: row.case_size,

		weight: row.weight,

		itemNumber: row.item_number,

		maxShelf: row.max_shelf,

		image: row.image_url
			? {
				url: row.image_url,
				alt: row.image_alt || row.description
			}
			: null,

		aisle: row.aisle,

		aisleSide: row.aisle_side,

		bay: row.bay
	};

};
router.post('/', async (req, res) => {

	const {
		upc,
		caseBarcode,
		alternativeBarcode,
		itemNumber,
		description,
		price,
		onHand,
		caseSize,
		weight,
		maxShelf,
		department,
		hffssStatus,
		rangeStatus,
		imageUrl,
		imageAlt
	} = req.body;

	try {

		if (!upc || !description) {
			return res.status(400).json({
				error: 'UPC and description are required.'
			});
		}

		const result = await pool.query(
			`
			INSERT INTO items (
				upc,
				case_barcode,
				alternative_barcode,
				item_number,
				description,
				price,
				on_hand,
				case_size,
				weight,
				max_shelf,
				department,
				hffss_status,
				range_status,
				image_url,
				image_alt
			)
			VALUES (
				$1,
				$2,
				$3,
				$4,
				$5,
				$6,
				$7,
				$8,
				$9,
				$10,
				$11,
				$12,
				$13,
				$14,
				$15
			)
			RETURNING *
			`,
			[
				upc,
				caseBarcode || null,
				alternativeBarcode || null,
				itemNumber || null,
				description,
				Number(price) || 0,
				Number(onHand) || 0,
				Number(caseSize) || 0,
				weight || null,
				Number(maxShelf) || 0,
				department || null,
				hffssStatus || 'Compliant',
				rangeStatus || 'in-range',
				imageUrl || null,
				imageAlt || description
			]
		);

		const row = result.rows[0];

		res.status(201).json({
			upc: row.upc,
			caseBarcode: row.case_barcode,
			alternativeBarcode: row.alternative_barcode,
			itemNumber: row.item_number,
			description: row.description,
			onHand: row.on_hand,
			price: Number(row.price),
			caseSize: row.case_size,
			weight: row.weight,
			maxShelf: row.max_shelf,
			department: row.department,
			hffssStatus: row.hffss_status,
			rangeStatus: row.range_status,
			image: row.image_url
				? {
					url: row.image_url,
					alt: row.image_alt || row.description
				}
				: null
		});

	} catch (error) {

		console.error(
			'Failed to create item:',
			error
		);

		if (error.code === '23505') {
			return res.status(409).json({
				error: 'An item with this barcode already exists.'
			});
		}

		res.status(500).json({
			error: 'Failed to create item.'
		});
	}
});


/* =========================================================
   GET PRODUCT SALES
========================================================= */

router.get('/:upc/sales', async (req, res) => {

	const { upc } = req.params;

	try {

		/* =====================================================
		   FIND PRODUCT
		===================================================== */

		const itemResult = await pool.query(`
			SELECT
				id,
				upc
			FROM items
			WHERE
				upc = $1
				OR case_barcode = $1
				OR alternative_barcode = $1
			LIMIT 1
		`, [
			upc
		]);


		if (!itemResult.rows.length) {

			return res.status(404).json({
				error: 'Product not found'
			});

		}


		const item =
			itemResult.rows[0];


		/* =====================================================
		   YESTERDAY
		===================================================== */

		const yesterdayResult = await pool.query(`
			SELECT
				units_sold,
				sales_value
			FROM item_sales_daily
			WHERE
				item_id = $1
				AND sales_date = CURRENT_DATE - INTERVAL '1 day'
			LIMIT 1
		`, [
			item.id
		]);


		const yesterday =
			yesterdayResult.rows.length
				? yesterdayResult.rows[0]
				: null;


		/* =====================================================
		   7 DAY TOTAL
		===================================================== */

		const sevenDayResult = await pool.query(`
			SELECT
				COALESCE(
					SUM(units_sold),
					0
				) AS units_sold,

				COALESCE(
					AVG(availability_percent),
					0
				) AS availability,

				COALESCE(
					SUM(sales_value),
					0
				) AS sales_value,

				COALESCE(
					SUM(lost_sales),
					0
				) AS lost_sales

			FROM item_sales_daily

			WHERE
				item_id = $1
				AND sales_date >= CURRENT_DATE - INTERVAL '7 days'
				AND sales_date < CURRENT_DATE
		`, [
			item.id
		]);


		/* =====================================================
		   28 DAY TOTAL
		===================================================== */

		const twentyEightDayResult = await pool.query(`
			SELECT
				COALESCE(
					SUM(units_sold),
					0
				) AS units_sold,

				COALESCE(
					AVG(availability_percent),
					0
				) AS availability,

				COALESCE(
					SUM(sales_value),
					0
				) AS sales_value,

				COALESCE(
					SUM(lost_sales),
					0
				) AS lost_sales

			FROM item_sales_daily

			WHERE
				item_id = $1
				AND sales_date >= CURRENT_DATE - INTERVAL '28 days'
				AND sales_date < CURRENT_DATE
		`, [
			item.id
		]);


		const sevenDay =
			sevenDayResult.rows[0];

		const twentyEightDay =
			twentyEightDayResult.rows[0];


		/* =====================================================
		   RESPONSE
		===================================================== */

		res.json({

			upc: item.upc,

			yesterday: {
				unitsSold:
					yesterday
						? Number(yesterday.units_sold)
						: 0,

				sales:
					yesterday
						? Number(yesterday.sales_value)
						: 0
			},

			sevenDays: {
				unitsSold:
					Number(sevenDay.units_sold),

				availability:
					Number(sevenDay.availability),

				totalSales:
					Number(sevenDay.sales_value),

				lostSales:
					Number(sevenDay.lost_sales)
			},

			twentyEightDays: {
				unitsSold:
					Number(twentyEightDay.units_sold),

				availability:
					Number(twentyEightDay.availability),

				totalSales:
					Number(twentyEightDay.sales_value),

				lostSales:
					Number(twentyEightDay.lost_sales)
			}

		});


	} catch (error) {

		console.error(
			'Failed to get product sales:',
			error
		);

		res.status(500).json({
			error: 'Failed to retrieve product sales'
		});

	}

});

router.get(
	'/modular/:modularId',
	async (req, res) => {

		const modularId =
			req.params.modularId;

		try {

			const result =
				await pool.query(
					`
					SELECT
						i.id,
						i.upc,
						i.description,
						i.image_url,
						i.image_alt,
						m.shelf,
						m.aisle,
						m.aisle_side,
						m.bay,
						m.modular_id

					FROM modulars m

					INNER JOIN items i
						ON i.id = m.item_id

					WHERE m.modular_id = $1

					ORDER BY
						CAST(
							NULLIF(
								REGEXP_REPLACE(
									m.shelf,
									'[^0-9]',
									'',
									'g'
								),
								''
							) AS INTEGER
						),
						i.description
					`,
					[modularId]
				);

			res.json(
				result.rows.map(
					row => ({
						id: row.id,
						upc: row.upc,
						description: row.description,
						image: row.image_url
							? {
								url: row.image_url,
								alt:
									row.image_alt ||
									row.description
							}
							: null,
						shelf: row.shelf,
						aisle: row.aisle,
						aisleSide:
							row.aisle_side,
						bay: row.bay,
						modularId:
							row.modular_id
					})
				)
			);

		} catch (error) {

			console.error(
				'Failed to load modular products:',
				error
			);

			res.status(500).json({
				error:
					'Failed to load modular products.'
			});

		}
	}
);
/* =========================================================
   FORMAT LOCATION
========================================================= */

const formatLocation = (row) => {

	return {
		id: row.id,

		itemId: row.item_id,

		upc: row.upc,

		aisle: row.aisle,

		aisleSide: row.aisle_side,

		bay: row.bay,

		shelf: row.shelf,

		modularId: row.modular_id,

		isPrimary: row.is_primary
	};

};



/* =========================================================
   GET ALL PRODUCTS
========================================================= */

router.get('/', async (req, res) => {

	try {

		const result = await pool.query(`
			SELECT
				i.*,

				primary_location.aisle,
				primary_location.aisle_side,
				primary_location.bay

			FROM items i

			LEFT JOIN LATERAL (
				SELECT
					aisle,
					aisle_side,
					bay

				FROM modulars

				WHERE modulars.item_id = i.id

				ORDER BY is_primary DESC, id ASC

				LIMIT 1

			) primary_location ON TRUE

			ORDER BY i.description
		`);


		res.json(
			result.rows.map(formatItem)
		);


	} catch (error) {

		console.error(
			'Failed to get products:',
			error
		);

		res.status(500).json({
			error: 'Failed to retrieve products'
		});

	}

});



/* =========================================================
   SEARCH PRODUCTS
========================================================= */

router.get('/search', async (req, res) => {

	const query =
		String(req.query.q || '').trim();


	if (!query) {

		return res.json([]);

	}


	try {

		const result = await pool.query(`
			SELECT
				i.*,

				primary_location.aisle,
				primary_location.aisle_side,
				primary_location.bay

			FROM items i

			LEFT JOIN LATERAL (
				SELECT
					aisle,
					aisle_side,
					bay

				FROM modulars

				WHERE modulars.item_id = i.id

				ORDER BY is_primary DESC, id ASC

				LIMIT 1

			) primary_location ON TRUE

			WHERE
				i.upc ILIKE $1
				OR i.case_barcode ILIKE $1
				OR i.alternative_barcode ILIKE $1
				OR i.description ILIKE $1

			ORDER BY i.description
		`, [
			`%${query}%`
		]);


		res.json(
			result.rows.map(formatItem)
		);


	} catch (error) {

		console.error(
			'Failed to search products:',
			error
		);

		res.status(500).json({
			error: 'Failed to search products'
		});

	}

});

/* =========================================================
   UPDATE LOCATION
========================================================= */

router.put(
	'/locations/:id',
	async (req, res) => {

		const locationId =
			req.params.id;

		const {
            aisle,
            aisleSide,
            bay,
            shelf,
            modularId,
            isPrimary
        } = req.body;

        const finalModularId =
            modularId?.trim() ||
            `FF-${aisle}-${aisleSide}-${bay}`;

		try {

			const result =
				await pool.query(
					`
					UPDATE modulars
					SET
						aisle = $1,
						aisle_side = $2,
						bay = $3,
						shelf = $4,
						modular_id = $5,
						is_primary = $6
					WHERE id = $7
					RETURNING *
					`,
					[
                        aisle || null,
                        aisleSide || null,
                        bay || null,
                        shelf || null,
                        finalModularId,
                        Boolean(isPrimary),
                        locationId
                    ]
				);


			if (!result.rows.length) {

				return res.status(404).json({
					error:
						'Location not found.'
				});

			}


			/*
				If this location is being made primary,
				remove primary status from the other
				locations belonging to the same item.
			*/

			if (Boolean(isPrimary)) {

				const itemId =
					result.rows[0].item_id;


				await pool.query(
					`
					UPDATE modulars
					SET is_primary = FALSE
					WHERE
						item_id = $1
						AND id <> $2
					`,
					[
						itemId,
						locationId
					]
				);


				await pool.query(
					`
					UPDATE modulars
					SET is_primary = TRUE
					WHERE id = $1
					`,
					[
						locationId
					]
				);

			}


			res.json(
				result.rows[0]
			);

		} catch (error) {

			console.error(
				'Failed to update location:',
				error
			);

			res.status(500).json({
				error:
					'Failed to update location.'
			});

		}

	}
);

/* =========================================================
   GET SINGLE PRODUCT
========================================================= */

router.get('/:upc', async (req, res) => {

	const { upc } = req.params;


	try {

		const productResult = await pool.query(`
			SELECT
				i.*,

				primary_location.aisle,
				primary_location.aisle_side,
				primary_location.bay

			FROM items i

			LEFT JOIN LATERAL (
				SELECT
					aisle,
					aisle_side,
					bay

				FROM modulars

				WHERE modulars.item_id = i.id

				ORDER BY is_primary DESC, id ASC

				LIMIT 1

			) primary_location ON TRUE

			WHERE
				i.upc = $1
				OR i.case_barcode = $1
				OR i.alternative_barcode = $1

			LIMIT 1
		`, [upc]);


		if (!productResult.rows.length) {

			return res.status(404).json({
				error: 'Product not found'
			});

		}


		const productRow =
			productResult.rows[0];


		const locationResult = await pool.query(`
			SELECT
				m.*,
				i.upc

			FROM modulars m

			JOIN items i
				ON i.id = m.item_id

			WHERE m.item_id = $1

			ORDER BY m.is_primary DESC, m.id ASC
		`, [
			productRow.id
		]);


		const product =
			formatItem(productRow);


		product.locations =
			locationResult.rows.map(formatLocation);


		res.json(product);


	} catch (error) {

		console.error(
			'Failed to get product:',
			error
		);

		res.status(500).json({
			error: 'Failed to retrieve product'
		});

	}

});



/* =========================================================
   GET PRODUCT LOCATIONS
========================================================= */

router.get('/:upc/locations', async (req, res) => {

	const { upc } = req.params;


	try {

		const itemResult =
			await pool.query(`
				SELECT id, upc
				FROM items
				WHERE
					upc = $1
					OR case_barcode = $1
					OR alternative_barcode = $1

				LIMIT 1
			`, [
				upc
			]);


		if (!itemResult.rows.length) {

			return res.status(404).json({
				error: 'Product not found'
			});

		}


		const item =
			itemResult.rows[0];


		const result = await pool.query(`
			SELECT
				m.*,
				i.upc

			FROM modulars m

			JOIN items i
				ON i.id = m.item_id

			WHERE m.item_id = $1

			ORDER BY m.is_primary DESC, m.id ASC
		`, [
			item.id
		]);


		res.json(
			result.rows.map(formatLocation)
		);


	} catch (error) {

		console.error(
			'Failed to get locations:',
			error
		);

		res.status(500).json({
			error: 'Failed to retrieve locations'
		});

	}

});



/* =========================================================
   ADD LOCATION
========================================================= */

router.post('/:upc/locations', async (req, res) => {

	const { upc } = req.params;

	const {
		aisle,
		aisleSide,
		bay,
		shelf,
		isPrimary
	} = req.body;


	try {

		/* =====================================================
		   CHECK PRODUCT EXISTS
		===================================================== */

		const itemResult =
			await pool.query(`
				SELECT id, upc
				FROM items
				WHERE
					upc = $1
					OR case_barcode = $1
					OR alternative_barcode = $1

				LIMIT 1
			`, [
				upc
			]);


		if (!itemResult.rows.length) {

			return res.status(404).json({
				error: 'Product not found'
			});

		}


		const item =
			itemResult.rows[0];



		/* =====================================================
		   CLEAN LOCATION VALUES
		===================================================== */

		let cleanAisle =
			String(aisle || '').trim();


		const cleanAisleSide =
			String(aisleSide || '')
				.trim()
				.toUpperCase();


		const cleanBay =
			String(bay || '').trim();


		const cleanShelf =
			String(shelf || '').trim();



		/* =====================================================
		   NORMALISE AISLE

		   Accepts:

		   16
		   FF16
		   FF-16

		   Stores:

		   16
		===================================================== */

		if (
			cleanAisle
				.toUpperCase()
				.startsWith('FF-')
		) {

			cleanAisle =
				cleanAisle.substring(3);

		} else if (
			cleanAisle
				.toUpperCase()
				.startsWith('FF')
		) {

			cleanAisle =
				cleanAisle
					.substring(2)
					.replace(/^-/, '');

		}



		/* =====================================================
		   GENERATE MODULAR ID

		   Format:

		   FF-aisle-side-bay

		   Example:

		   FF-16-R-20

		   Shelf is NOT included.
		===================================================== */

		let generatedModularId = null;


		if (
			cleanAisle &&
			cleanAisleSide &&
			cleanBay
		) {

			generatedModularId =
				`FF-${cleanAisle}-${cleanAisleSide}-${cleanBay}`;

		}



		/* =====================================================
		   CHECK MODULAR ID IS UNIQUE
		===================================================== */

		if (generatedModularId) {

			const existingModular =
				await pool.query(`
					SELECT id
					FROM modulars
					WHERE modular_id = $1
					LIMIT 1
				`, [
					generatedModularId
				]);


			if (existingModular.rows.length) {

				return res.status(409).json({
					error:
						`Modular ID ${generatedModularId} is already in use`
				});

			}

		}



		/* =====================================================
		   FIND LOWEST AVAILABLE DATABASE ID

		   Example:

		   IDs:
		   1
		   2
		   3
		   5

		   Next ID:

		   4
		===================================================== */

		const nextIdResult =
			await pool.query(`
				SELECT COALESCE(
					(
						SELECT MIN(m.id + 1)
						FROM modulars m
						LEFT JOIN modulars next_m
							ON next_m.id = m.id + 1
						WHERE next_m.id IS NULL
					),
					1
				) AS next_id
			`);


		const nextId =
			nextIdResult.rows[0].next_id;



		/* =====================================================
		   CHECK EXISTING LOCATIONS
		===================================================== */

		const locationCountResult =
			await pool.query(`
				SELECT COUNT(*) AS count
				FROM modulars
				WHERE item_id = $1
			`, [
				item.id
			]);


		const locationCount =
			Number(
				locationCountResult.rows[0].count
			);



		/* =====================================================
		   DETERMINE PRIMARY LOCATION
		===================================================== */

		const shouldBePrimary =
			locationCount === 0 ||
			Boolean(isPrimary);



		/* =====================================================
		   REMOVE EXISTING PRIMARY LOCATION
		   IF NECESSARY
		===================================================== */

		if (shouldBePrimary) {

			await pool.query(`
				UPDATE modulars
				SET is_primary = FALSE
				WHERE item_id = $1
			`, [
				item.id
			]);

		}



		/* =====================================================
		   INSERT LOCATION
		===================================================== */

		const result =
			await pool.query(`
				INSERT INTO modulars (
					id,
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
					$7,
					$8
				)

				RETURNING *
			`, [
				nextId,
				item.id,
				cleanAisle || null,
				cleanAisleSide || null,
				cleanBay || null,
				cleanShelf || null,
				generatedModularId,
				shouldBePrimary
			]);


		const location =
			result.rows[0];


		location.upc =
			item.upc;


		res.status(201).json(
			formatLocation(location)
		);


	} catch (error) {

		console.error(
			'Failed to add location:',
			error
		);

		res.status(500).json({
			error: 'Failed to add location'
		});

	}

});



/* =========================================================
   UPDATE PRODUCT
========================================================= */

router.put('/:upc', async (req, res) => {

	const { upc } = req.params;

	const {
		description,
		onHand,
		price,
		caseSize,
		weight,
		itemNumber,
		maxShelf,
		department,
		imageUrl,
		imageAlt,
		caseBarcode,
		alternativeBarcode,
		hffssStatus,
		rangeStatus
	} = req.body;


	try {

		const result = await pool.query(`
			UPDATE items

			SET
				description = COALESCE($1, description),
				on_hand = COALESCE($2, on_hand),
				price = COALESCE($3, price),
				case_size = COALESCE($4, case_size),
				weight = COALESCE($5, weight),
				item_number = COALESCE($6, item_number),
				max_shelf = COALESCE($7, max_shelf),
				department = COALESCE($8, department),

				image_url = COALESCE($9, image_url),
				image_alt = COALESCE($10, image_alt),

				case_barcode = COALESCE($11, case_barcode),
				alternative_barcode = COALESCE($12, alternative_barcode),

				hffss_status = COALESCE($13, hffss_status),
				range_status = COALESCE($14, range_status),

				updated_at = CURRENT_TIMESTAMP

			WHERE
				upc = $15
				OR case_barcode = $15
				OR alternative_barcode = $15

			RETURNING *
		`, [
			description,        // $1
			onHand,             // $2
			price,              // $3
			caseSize,           // $4
			weight,             // $5
			itemNumber,         // $6
			maxShelf,           // $7
			department,         // $8
			imageUrl || null,   // $9
			imageAlt || null,   // $10
			caseBarcode,        // $11
			alternativeBarcode, // $12
			hffssStatus,        // $13
			rangeStatus,        // $14
			upc                 // $15
		]);


		if (!result.rows.length) {

			return res.status(404).json({
				error: 'Product not found'
			});

		}


		res.json(
			formatItem(result.rows[0])
		);


	} catch (error) {

		console.error(
			'Failed to update product:',
			error
		);


		/* =====================================================
		   BARCODE DUPLICATE ERROR
		===================================================== */

		if (
			error.message ===
			'Barcode already exists on another item.'
		) {

			return res.status(409).json({
				error:
					'Barcode already exists on another item.'
			});

		}


		if (
			error.message ===
			'Barcode cannot be duplicated within the same item.'
		) {

			return res.status(409).json({
				error:
					'Barcode cannot be duplicated within the same item.'
			});

		}


		res.status(500).json({
			error: 'Failed to update product'
		});

	}

});
/* =========================================================
   DELETE LOCATION
========================================================= */

router.delete('/locations/:id', async (req, res) => {

	const { id } = req.params;


	try {

		const result = await pool.query(`
			DELETE FROM modulars
			WHERE id = $1
			RETURNING *
		`, [
			id
		]);


		if (!result.rows.length) {

			return res.status(404).json({
				error: 'Location not found'
			});

		}


		/*
			If the deleted location was primary,
			make the lowest-ID remaining location
			for that product primary.
		*/

		const deletedLocation =
			result.rows[0];


		if (deletedLocation.is_primary) {

			await pool.query(`
				UPDATE modulars
				SET is_primary = FALSE
				WHERE item_id = $1
			`, [
				deletedLocation.item_id
			]);


			await pool.query(`
				UPDATE modulars
				SET is_primary = TRUE
				WHERE id = (
					SELECT id
					FROM modulars
					WHERE item_id = $1
					ORDER BY id ASC
					LIMIT 1
				)
			`, [
				deletedLocation.item_id
			]);

		}


		res.json({
			success: true
		});


	} catch (error) {

		console.error(
			'Failed to delete location:',
			error
		);

		res.status(500).json({
			error: 'Failed to delete location'
		});

	}

});



/* =========================================================
   SET PRIMARY LOCATION
========================================================= */

router.put(
	'/:upc/locations/:id/primary',
	async (req, res) => {

		const {
			upc,
			id
		} = req.params;


		try {

			const location =
				await pool.query(`
					SELECT
						m.*,
						i.upc

					FROM modulars m

					JOIN items i
						ON i.id = m.item_id

					WHERE
						m.id = $1
						AND (
							i.upc = $2
							OR i.case_barcode = $2
							OR i.alternative_barcode = $2
						)
				`, [
					id,
					upc
				]);


			if (!location.rows.length) {

				return res.status(404).json({
					error: 'Location not found'
				});

			}


			const itemId =
				location.rows[0].item_id;


			await pool.query(`
				UPDATE modulars
				SET is_primary = FALSE
				WHERE item_id = $1
			`, [
				itemId
			]);


			const result =
				await pool.query(`
					UPDATE modulars
					SET is_primary = TRUE
					WHERE id = $1
					RETURNING *
				`, [
					id
				]);


			result.rows[0].upc =
				location.rows[0].upc;


			res.json(
				formatLocation(result.rows[0])
			);


		} catch (error) {

			console.error(
				'Failed to set primary location:',
				error
			);

			res.status(500).json({
				error: 'Failed to set primary location'
			});

		}

	}
);



module.exports = router;