const express = require('express');
const pool = require('../db/pool');

const router = express.Router();



/* =========================================================
   FORMAT DATABASE ITEM
========================================================= */

const formatItem = (row) => {

	return {
		upc: row.upc,

		description: row.description,

		onHand: row.on_hand,

		price: Number(row.price),

		caseSize: row.case_size,

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



/* =========================================================
   FORMAT LOCATION
========================================================= */

const formatLocation = (row) => {

	return {
		id: row.id,

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

				WHERE modulars.upc = i.upc

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

				WHERE modulars.upc = i.upc

				ORDER BY is_primary DESC, id ASC

				LIMIT 1

			) primary_location ON TRUE

			WHERE
				i.upc ILIKE $1
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

				WHERE modulars.upc = i.upc

				ORDER BY is_primary DESC, id ASC

				LIMIT 1

			) primary_location ON TRUE

			WHERE i.upc = $1
		`, [upc]);


		if (!productResult.rows.length) {

			return res.status(404).json({
				error: 'Product not found'
			});

		}


		const locationResult = await pool.query(`
			SELECT *
			FROM modulars
			WHERE upc = $1
			ORDER BY is_primary DESC, id ASC
		`, [upc]);


		const product =
			formatItem(productResult.rows[0]);


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

		const result = await pool.query(`
			SELECT *
			FROM modulars
			WHERE upc = $1
			ORDER BY is_primary DESC, id ASC
		`, [upc]);


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

		const item =
			await pool.query(
				'SELECT upc FROM items WHERE upc = $1',
				[upc]
			);


		if (!item.rows.length) {

			return res.status(404).json({
				error: 'Product not found'
			});

		}



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
				WHERE upc = $1
			`, [
				upc
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
				WHERE upc = $1
			`, [
				upc
			]);

		}



		/* =====================================================
		   INSERT LOCATION
		===================================================== */

		const result =
			await pool.query(`
				INSERT INTO modulars (
					id,
					upc,
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
				upc,
				cleanAisle || null,
				cleanAisleSide || null,
				cleanBay || null,
				cleanShelf || null,
				generatedModularId,
				shouldBePrimary
			]);


		res.status(201).json(
			formatLocation(result.rows[0])
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
		itemNumber,
		maxShelf,
		image
	} = req.body;


	try {

		const result = await pool.query(`
			UPDATE items

			SET
				description = COALESCE($1, description),
				on_hand = COALESCE($2, on_hand),
				price = COALESCE($3, price),
				case_size = COALESCE($4, case_size),
				item_number = COALESCE($5, item_number),
				max_shelf = COALESCE($6, max_shelf),
				image_url = COALESCE($7, image_url),
				image_alt = COALESCE($8, image_alt),
				updated_at = CURRENT_TIMESTAMP

			WHERE upc = $9

			RETURNING *
		`, [
			description,
			onHand,
			price,
			caseSize,
			itemNumber,
			maxShelf,
			image?.url,
			image?.alt,
			upc
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
				WHERE upc = $1
			`, [
				deletedLocation.upc
			]);


			await pool.query(`
				UPDATE modulars
				SET is_primary = TRUE
				WHERE id = (
					SELECT id
					FROM modulars
					WHERE upc = $1
					ORDER BY id ASC
					LIMIT 1
				)
			`, [
				deletedLocation.upc
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
					SELECT *
					FROM modulars
					WHERE id = $1
					AND upc = $2
				`, [
					id,
					upc
				]);


			if (!location.rows.length) {

				return res.status(404).json({
					error: 'Location not found'
				});

			}


			await pool.query(`
				UPDATE modulars
				SET is_primary = FALSE
				WHERE upc = $1
			`, [
				upc
			]);


			const result =
				await pool.query(`
					UPDATE modulars
					SET is_primary = TRUE
					WHERE id = $1
					AND upc = $2
					RETURNING *
				`, [
					id,
					upc
				]);


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