const express = require('express');
const pool = require('../db/pool');

const router = express.Router();


/* =========================================================
   GET MODULAR TAG
========================================================= */

router.get(
	'/modular-tags/:modularId',
	async (
		req,
		res
	) => {

		const modularId =
			String(
				req.params.modularId || ''
			)
				.trim()
				.toUpperCase();


		try {

			const result =
				await pool.query(
					`
					SELECT
						id,
						modular_id,
						department,
						aisle,
						aisle_side,
						bay,
						active

					FROM modular_tags

					WHERE
						modular_id = $1
						AND active = TRUE

					LIMIT 1
					`,
					[
						modularId
					]
				);


			if (
				!result.rows.length
			) {

				return res.status(404).json({
					exists: false
				});

			}


			const tag =
				result.rows[0];


			res.json({

				exists: true,

				tag: {

					id:
						tag.id,

					modularId:
						tag.modular_id,

					department:
						tag.department,

					aisle:
						tag.aisle,

					aisleSide:
						tag.aisle_side,

					bay:
						tag.bay,

					active:
						tag.active

				}

			});


		} catch (error) {

			console.error(
				'Failed to find modular tag:',
				error
			);


			res.status(500).json({
				error:
					'Failed to find modular tag.'
			});

		}

	}
);
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

		/* =====================================================
	   DATABASE VALIDATION ERRORS
	===================================================== */

	if (
		error.code === 'P0001' &&
		error.message ===
			'Barcode or Asda item number already exists on another item.'
	) {

		return res.status(409).json({
			error:
				'Barcode or Asda item number already exists on another item.'
		});
	}


	if (
		error.code === 'P0001' &&
		error.message ===
			'UPC cannot match another identifier on the same item.'
	) {

		return res.status(409).json({
			error:
				'UPC cannot match another identifier on the same item.'
		});
	}


	if (
		error.code === 'P0001' &&
		error.message ===
			'Case barcode cannot match another identifier on the same item.'
	) {

		return res.status(409).json({
			error:
				'Case barcode cannot match another identifier on the same item.'
		});
	}


	if (
		error.code === 'P0001' &&
		error.message ===
			'Alternative barcode cannot match the item number on the same item.'
	) {

		return res.status(409).json({
			error:
				'Alternative barcode cannot match the item number on the same item.'
		});
	}


	/* =====================================================
	   NORMAL POSTGRES UNIQUE CONSTRAINT
	===================================================== */

	if (error.code === '23505') {

		return res.status(409).json({
			error:
				'Barcode or Asda item number already exists.'
		});
	}


	/* =====================================================
	   GENERIC ERROR
	===================================================== */

	res.status(500).json({
		error: 'Failed to create item.'
	});
}
});
/* =========================================================
   ADMIN MODULAR ACTIVITY
========================================================= */

/*
	These endpoints are specifically for the Admin Panel.

	They intentionally do NOT use the modular_bays join/filter
	from the normal Modular Activity endpoint.

	Displayed/editable fields:

	- modular_name
	- department_number
	- planogram_number
	- due_date

	The database id is returned internally so the frontend
	can correctly edit/delete the selected record.

	created_at / updated_at are not returned.
*/


/* =========================================================
   GET ALL ADMIN MODULAR ACTIVITY
========================================================= */

router.get(
	'/admin/modular-activity',
	async (req, res) => {

		try {

			const result =
				await pool.query(`
					SELECT
						id,
						modular_name,
						department_number,
						planogram_number,
						due_date

					FROM modular_activity

					ORDER BY
						due_date,
						planogram_number,
						modular_name
				`);


			res.json(
				result.rows.map(row => ({
					id:
						row.id,

					modularName:
						row.modular_name,

					departmentNumber:
						row.department_number,

					planogramNumber:
						row.planogram_number,

					dueDate:
						row.due_date
							? row.due_date
								.toISOString()
								.slice(0, 10)
							: null
				}))
			);


		} catch (error) {

			console.error(
				'Unable to load admin modular activity:',
				error
			);

			res.status(500).json({
				error:
					'Unable to load admin modular activity.'
			});

		}

	}
);


/* =========================================================
   ADD ADMIN MODULAR ACTIVITY
========================================================= */

router.post(
	'/admin/modular-activity',
	async (req, res) => {

		const {
			modularName,
			departmentNumber,
			planogramNumber,
			dueDate
		} = req.body;


		const cleanModularName =
			String(
				modularName || ''
			).trim();


		const cleanDepartmentNumber =
			Number(
				departmentNumber
			);


		const cleanPlanogramNumber =
			Number(
				planogramNumber
			);


		const cleanDueDate =
			String(
				dueDate || ''
			).trim();


		if (!cleanModularName) {

			return res.status(400).json({
				error:
					'Modular name is required.'
			});

		}


		if (
			!Number.isInteger(
				cleanDepartmentNumber
			)
		) {

			return res.status(400).json({
				error:
					'Department number must be a whole number.'
			});

		}


		if (
			!Number.isInteger(
				cleanPlanogramNumber
			)
		) {

			return res.status(400).json({
				error:
					'Planogram number must be a whole number.'
			});

		}


		if (!cleanDueDate) {

			return res.status(400).json({
				error:
					'Due date is required.'
			});

		}


		try {

			const result =
				await pool.query(
					`
					INSERT INTO modular_activity (
						modular_name,
						department_number,
						planogram_number,
						due_date
					)

					VALUES (
						$1,
						$2,
						$3,
						$4
					)

					RETURNING
						id,
						modular_name,
						department_number,
						planogram_number,
						due_date
					`,
					[
						cleanModularName,
						cleanDepartmentNumber,
						cleanPlanogramNumber,
						cleanDueDate
					]
				);


			const row =
				result.rows[0];


			res.status(201).json({

				id:
					row.id,

				modularName:
					row.modular_name,

				departmentNumber:
					row.department_number,

				planogramNumber:
					row.planogram_number,

				dueDate:
					row.due_date
						.toISOString()
						.slice(0, 10)

			});


		} catch (error) {

			console.error(
				'Unable to create modular activity:',
				error
			);

			res.status(500).json({
				error:
					'Unable to create modular activity.'
			});

		}

	}
);


/* =========================================================
   UPDATE ADMIN MODULAR ACTIVITY
========================================================= */

router.put(
	'/admin/modular-activity/:id',
	async (req, res) => {

		const id =
			Number(
				req.params.id
			);


		const {
			modularName,
			departmentNumber,
			planogramNumber,
			dueDate
		} = req.body;


		if (
			!Number.isInteger(id)
		) {

			return res.status(400).json({
				error:
					'Invalid modular activity ID.'
			});

		}


		const cleanModularName =
			String(
				modularName || ''
			).trim();


		const cleanDepartmentNumber =
			Number(
				departmentNumber
			);


		const cleanPlanogramNumber =
			Number(
				planogramNumber
			);


		const cleanDueDate =
			String(
				dueDate || ''
			).trim();


		if (!cleanModularName) {

			return res.status(400).json({
				error:
					'Modular name is required.'
			});

		}


		if (
			!Number.isInteger(
				cleanDepartmentNumber
			)
		) {

			return res.status(400).json({
				error:
					'Department number must be a whole number.'
			});

		}


		if (
			!Number.isInteger(
				cleanPlanogramNumber
			)
		) {

			return res.status(400).json({
				error:
					'Planogram number must be a whole number.'
			});

		}


		if (!cleanDueDate) {

			return res.status(400).json({
				error:
					'Due date is required.'
			});

		}


		try {

			const result =
				await pool.query(
					`
					UPDATE modular_activity

					SET
						modular_name = $1,
						department_number = $2,
						planogram_number = $3,
						due_date = $4

					WHERE id = $5

					RETURNING
						id,
						modular_name,
						department_number,
						planogram_number,
						due_date
					`,
					[
						cleanModularName,
						cleanDepartmentNumber,
						cleanPlanogramNumber,
						cleanDueDate,
						id
					]
				);


			if (!result.rows.length) {

				return res.status(404).json({
					error:
						'Modular activity record not found.'
				});

			}


			const row =
				result.rows[0];


			res.json({

				id:
					row.id,

				modularName:
					row.modular_name,

				departmentNumber:
					row.department_number,

				planogramNumber:
					row.planogram_number,

				dueDate:
					row.due_date
						.toISOString()
						.slice(0, 10)

			});


		} catch (error) {

			console.error(
				'Unable to update modular activity:',
				error
			);

			res.status(500).json({
				error:
					'Unable to update modular activity.'
			});

		}

	}
);

/* =========================================================
   DELETE ADMIN MODULAR ACTIVITY
========================================================= */

router.delete(
	'/admin/modular-activity/:id',
	async (req, res) => {

		const id =
			Number(
				req.params.id
			);


		if (
			!Number.isInteger(id)
		) {

			return res.status(400).json({
				error:
					'Invalid modular activity ID.'
			});

		}


		const client =
			await pool.connect();


		try {

			await client.query(
				'BEGIN'
			);


			/* =================================================
			   FIND MODULAR ACTIVITY
			================================================= */

			const activityResult =
				await client.query(
					`
					SELECT
						id,
						planogram_number

					FROM modular_activity

					WHERE id = $1

					FOR UPDATE
					`,
					[
						id
					]
				);


			if (
				!activityResult.rows.length
			) {

				await client.query(
					'ROLLBACK'
				);

				return res.status(404).json({
					error:
						'Modular activity record not found.'
				});

			}


			const planogramNumber =
				activityResult.rows[0]
					.planogram_number;


			/* =================================================
			   FIND ALL MODULAR BAYS FOR THIS PLANOGRAM
			================================================= */

			const bayResult =
				await client.query(
					`
					SELECT
						id

					FROM modular_bays

					WHERE
						planogram_number = $1

					FOR UPDATE
					`,
					[
						planogramNumber
					]
				);


			const bayIds =
				bayResult.rows.map(
					row => row.id
				);


			/* =================================================
			   DELETE MODULAR ITEMS
			   
			   modular_items.modular_bay_id
			   matches modular_bays.id
			================================================= */

			if (
				bayIds.length
			) {

				await client.query(
					`
					DELETE FROM modular_items

					WHERE
						modular_bay_id =
							ANY($1::integer[])
					`,
					[
						bayIds
					]
				);

			}


			/* =================================================
			   DELETE MODULAR BAYS
			================================================= */

			if (
				bayIds.length
			) {

				await client.query(
					`
					DELETE FROM modular_bays

					WHERE
						id =
							ANY($1::integer[])
					`,
					[
						bayIds
					]
				);

			}


			/* =================================================
			   DELETE MODULAR ACTIVITY
			================================================= */

			await client.query(
				`
				DELETE FROM modular_activity

				WHERE id = $1
				`,
				[
					id
				]
			);


			/* =================================================
			   COMMIT
			================================================= */

			await client.query(
				'COMMIT'
			);


			res.json({

				success: true,

				id:
					id,

				planogramNumber:
					planogramNumber,

				deletedBayCount:
					bayIds.length

			});


		} catch (error) {

			await client.query(
				'ROLLBACK'
			);


			console.error(
				'Unable to delete modular activity:',
				error
			);


			res.status(500).json({
				error:
					'Unable to delete modular activity.'
			});


		} finally {

			client.release();

		}

	}
);
/* =========================================================
   ADMIN MODULAR BAYS
========================================================= */


/* =========================================================
   GET ADMIN MODULAR BAYS
========================================================= */

router.get(
	'/admin/modular-activity/bays/:planogramNumber',
	async (req, res) => {

		const planogramNumber =
			Number(
				req.params.planogramNumber
			);


		if (
			!Number.isInteger(
				planogramNumber
			)
		) {

			return res.status(400).json({
				error:
					'Invalid planogram number.'
			});

		}


		try {

			const result =
				await pool.query(
					`
					SELECT
						mb.id,
						mb.bay_number,
						mb.planogram_number,
						mb.modular_id,
						mb.status,

						COUNT(mi.id) AS item_count

					FROM modular_bays mb

					LEFT JOIN modular_items mi
						ON mi.modular_bay_id = mb.id

					WHERE
						mb.planogram_number = $1

					GROUP BY
						mb.id,
						mb.bay_number,
						mb.planogram_number,
						mb.modular_id,
						mb.status

					ORDER BY
						CAST(
							mb.bay_number AS INTEGER
						),
						mb.id
					`,
					[
						planogramNumber
					]
				);


			res.json(
				result.rows.map(
					row => ({

						id:
							row.id,

						bayNumber:
							row.bay_number,

						planogramNumber:
							row.planogram_number,

						modularId:
							row.modular_id,

						status:
							row.status,

						itemCount:
							Number(
								row.item_count
							)

					})
				)
			);


		} catch (error) {

			console.error(
				'Unable to load admin modular bays:',
				error
			);


			res.status(500).json({
				error:
					'Unable to load modular bays.'
			});

		}

	}
);


/* =========================================================
   ADD ADMIN MODULAR BAY
========================================================= */

router.post(
	'/admin/modular-activity/bays',
	async (req, res) => {

		const {
			bayNumber,
			status,
			planogramNumber
		} = req.body;


		const cleanBayNumber =
			Number(
				bayNumber
			);


		const cleanPlanogramNumber =
			Number(
				planogramNumber
			);


		const cleanStatus =
			String(
				status ||
				'Due to land'
			)
				.trim();


		if (
			!Number.isInteger(
				cleanBayNumber
			)
		) {

			return res.status(400).json({
				error:
					'Bay number must be a whole number.'
			});

		}


		if (
			!Number.isInteger(
				cleanPlanogramNumber
			)
		) {

			return res.status(400).json({
				error:
					'Planogram number must be a whole number.'
			});

		}


		if (!cleanStatus) {

			return res.status(400).json({
				error:
					'Bay status is required.'
			});

		}


		try {

			/* =================================================
			   CHECK PLANOGRAM EXISTS
			================================================= */

			const activityResult =
				await pool.query(
					`
					SELECT
						id

					FROM modular_activity

					WHERE
						planogram_number = $1

					LIMIT 1
					`,
					[
						cleanPlanogramNumber
					]
				);


			if (
				!activityResult.rows.length
			) {

				return res.status(404).json({
					error:
						'Modular activity record not found.'
				});

			}


			/* =================================================
			   CHECK BAY DOES NOT ALREADY EXIST
			================================================= */

			const existingResult =
				await pool.query(
					`
					SELECT
						id

					FROM modular_bays

					WHERE
						planogram_number = $1
						AND bay_number = $2

					LIMIT 1
					`,
					[
						cleanPlanogramNumber,
						cleanBayNumber
					]
				);


			if (
				existingResult.rows.length
			) {

				return res.status(409).json({
					error:
						`Bay ${cleanBayNumber} already exists on this planogram.`
				});

			}


			/* =================================================
			   INSERT BAY
			================================================= */

			const result =
				await pool.query(
					`
					INSERT INTO modular_bays (
						bay_number,
						planogram_number,
						status,
						last_updated
					)

					VALUES (
						$1,
						$2,
						$3,
						CURRENT_TIMESTAMP
					)

					RETURNING
						id,
						bay_number,
						planogram_number,
						modular_id,
						status,
						last_updated
					`,
					[
						cleanBayNumber,
						cleanPlanogramNumber,
						cleanStatus
					]
				);


			const row =
				result.rows[0];


			res.status(201).json({

				id:
					row.id,

				bayNumber:
					row.bay_number,

				planogramNumber:
					row.planogram_number,

				modularId:
					row.modular_id,

				status:
					row.status,

				lastUpdated:
					row.last_updated,

				itemCount:
					0

			});


		} catch (error) {

			console.error(
				'Unable to create modular bay:',
				error
			);


			res.status(500).json({
				error:
					'Unable to create modular bay.'
			});

		}

	}
);


/* =========================================================
   UPDATE ADMIN MODULAR BAY
========================================================= */

router.put(
	'/admin/modular-activity/bays/:id',
	async (req, res) => {

		const id =
			Number(
				req.params.id
			);


		const {
			bayNumber,
			status
		} = req.body;


		const cleanBayNumber =
			Number(
				bayNumber
			);


		const cleanStatus =
			String(
				status ||
				''
			)
				.trim();


		if (
			!Number.isInteger(id)
		) {

			return res.status(400).json({
				error:
					'Invalid modular bay ID.'
			});

		}


		if (
			!Number.isInteger(
				cleanBayNumber
			)
		) {

			return res.status(400).json({
				error:
					'Bay number must be a whole number.'
			});

		}


		if (!cleanStatus) {

			return res.status(400).json({
				error:
					'Bay status is required.'
			});

		}


		try {

			/* =================================================
			   FIND EXISTING BAY
			================================================= */

			const existingBayResult =
				await pool.query(
					`
					SELECT
						id,
						planogram_number

					FROM modular_bays

					WHERE id = $1
					`,
					[
						id
					]
				);


			if (
				!existingBayResult.rows.length
			) {

				return res.status(404).json({
					error:
						'Modular bay not found.'
				});

			}


			const planogramNumber =
				existingBayResult.rows[0]
					.planogram_number;


			/* =================================================
			   CHECK FOR DUPLICATE BAY NUMBER
			================================================= */

			const duplicateResult =
				await pool.query(
					`
					SELECT
						id

					FROM modular_bays

					WHERE
						planogram_number = $1
						AND bay_number = $2
						AND id <> $3

					LIMIT 1
					`,
					[
						planogramNumber,
						cleanBayNumber,
						id
					]
				);


			if (
				duplicateResult.rows.length
			) {

				return res.status(409).json({
					error:
						`Bay ${cleanBayNumber} already exists on this planogram.`
				});

			}


			/* =================================================
			   UPDATE BAY
			================================================= */

			const result =
				await pool.query(
					`
					UPDATE modular_bays

					SET
						bay_number = $1,
						status = $2,
						last_updated = CURRENT_TIMESTAMP

					WHERE
						id = $3

					RETURNING
						id,
						bay_number,
						planogram_number,
						modular_id,
						status,
						last_updated
					`,
					[
						cleanBayNumber,
						cleanStatus,
						id
					]
				);


			const row =
				result.rows[0];


			/* =================================================
			   GET ITEM COUNT
			================================================= */

			const countResult =
				await pool.query(
					`
					SELECT
						COUNT(*) AS item_count

					FROM modular_items

					WHERE
						modular_bay_id = $1
					`,
					[
						id
					]
				);


			res.json({

				id:
					row.id,

				bayNumber:
					row.bay_number,

				planogramNumber:
					row.planogram_number,

				modularId:
					row.modular_id,

				status:
					row.status,

				lastUpdated:
					row.last_updated,

				itemCount:
					Number(
						countResult.rows[0]
							.item_count
					)

			});


		} catch (error) {

			console.error(
				'Unable to update modular bay:',
				error
			);


			res.status(500).json({
				error:
					'Unable to update modular bay.'
			});

		}

	}
);


/* =========================================================
   DELETE ADMIN MODULAR BAY
========================================================= */

router.delete(
	'/admin/modular-activity/bays/:id',
	async (req, res) => {

		const id =
			Number(
				req.params.id
			);


		if (
			!Number.isInteger(id)
		) {

			return res.status(400).json({
				error:
					'Invalid modular bay ID.'
			});

		}


		const client =
			await pool.connect();


		try {

			await client.query(
				'BEGIN'
			);


			/* =================================================
			   FIND BAY
			================================================= */

			const bayResult =
				await client.query(
					`
					SELECT
						id,
						bay_number,
						planogram_number,
						status

					FROM modular_bays

					WHERE id = $1

					FOR UPDATE
					`,
					[
						id
					]
				);


			if (
				!bayResult.rows.length
			) {

				await client.query(
					'ROLLBACK'
				);


				return res.status(404).json({
					error:
						'Modular bay not found.'
				});

			}


			const bay =
				bayResult.rows[0];


			/* =================================================
			   DELETE MODULAR ITEMS

			   modular_items.modular_bay_id
			   points to modular_bays.id
			================================================= */

			const itemDeleteResult =
				await client.query(
					`
					DELETE FROM modular_items

					WHERE
						modular_bay_id = $1
					`,
					[
						id
					]
				);


			/* =================================================
			   DELETE MODULAR BAY
			================================================= */

			await client.query(
				`
				DELETE FROM modular_bays

				WHERE
					id = $1
				`,
				[
					id
				]
			);


			/* =================================================
			   COMMIT
			================================================= */

			await client.query(
				'COMMIT'
			);


			res.json({

				success:
					true,

				id:
					id,

				bayNumber:
					bay.bay_number,

				planogramNumber:
					bay.planogram_number,

				status:
					bay.status,

				deletedItemCount:
					itemDeleteResult.rowCount

			});


		} catch (error) {

			await client.query(
				'ROLLBACK'
			);


			console.error(
				'Unable to delete modular bay:',
				error
			);


			res.status(500).json({
				error:
					'Unable to delete modular bay.'
			});


		} finally {

			client.release();

		}

	}
);
/* =========================================================
   ADMIN MODULAR BAY ITEMS
========================================================= */


/* =========================================================
   SEARCH PRODUCTS FOR MODULAR BAY
========================================================= */

router.get(
	'/admin/modular-activity/bay-items/search',
	async (req, res) => {

		const query =
			String(
				req.query.q || ''
			).trim();


		if (!query) {

			return res.json([]);

		}


		try {

			const result =
				await pool.query(
					`
					SELECT
						i.id,
						i.upc,
						i.description,
						i.max_shelf,
						i.image_url,
						i.image_alt

					FROM items i

					WHERE
						i.upc ILIKE $1
						OR i.case_barcode ILIKE $1
						OR i.alternative_barcode ILIKE $1
						OR i.description ILIKE $1

					ORDER BY
						i.description

					LIMIT 20
					`,
					[
						`%${query}%`
					]
				);


			res.json(
				result.rows.map(
					row => ({

						itemId:
							row.id,

						upc:
							row.upc,

						description:
							row.description,

						maxShelf:
							row.max_shelf,

						image:
							row.image_url
								? {
									url:
										row.image_url,

									alt:
										row.image_alt ||
										row.description
								}
								: null

					})
				)
			);


		} catch (error) {

			console.error(
				'Unable to search modular bay products:',
				error
			);


			res.status(500).json({
				error:
					'Unable to search products.'
			});

		}

	}
);


/* =========================================================
   ADD ITEM TO MODULAR BAY
========================================================= */

router.post(
	'/admin/modular-activity/bays/:bayId/items',
	async (req, res) => {

		const bayId =
			Number(
				req.params.bayId
			);


		const {
			itemId,
			shelf,
			maxShelf,
			facings
		} = req.body;


		const cleanItemId =
			Number(
				itemId
			);


		const cleanShelf =
			String(
				shelf || ''
			).trim();


		const cleanMaxShelf =
			Number(
				maxShelf
			);


		const cleanFacings =
			Number(
				facings
			);


		if (
			!Number.isInteger(
				bayId
			)
		) {

			return res.status(400).json({
				error:
					'Invalid modular bay ID.'
			});

		}


		if (
			!Number.isInteger(
				cleanItemId
			)
		) {

			return res.status(400).json({
				error:
					'Invalid item.'
			});

		}


		if (!cleanShelf) {

			return res.status(400).json({
				error:
					'Shelf is required.'
			});

		}


		if (
			!Number.isInteger(
				cleanMaxShelf
			) ||
			cleanMaxShelf < 0
		) {

			return res.status(400).json({
				error:
					'Max shelf must be a valid whole number.'
			});

		}


		if (
			!Number.isInteger(
				cleanFacings
			) ||
			cleanFacings < 1
		) {

			return res.status(400).json({
				error:
					'Facings must be at least 1.'
			});

		}


		try {

			/* =================================================
			   CHECK BAY
			================================================= */

			const bayResult =
				await pool.query(
					`
					SELECT
						id

					FROM modular_bays

					WHERE id = $1

					LIMIT 1
					`,
					[
						bayId
					]
				);


			if (
				!bayResult.rows.length
			) {

				return res.status(404).json({
					error:
						'Modular bay not found.'
				});

			}


			/* =================================================
			   CHECK ITEM
			================================================= */

			const itemResult =
				await pool.query(
					`
					SELECT
						id,
						upc,
						description,
						max_shelf,
						image_url,
						image_alt

					FROM items

					WHERE id = $1

					LIMIT 1
					`,
					[
						cleanItemId
					]
				);


			if (
				!itemResult.rows.length
			) {

				return res.status(404).json({
					error:
						'Product not found.'
				});

			}


			const item =
				itemResult.rows[0];


			/* =================================================
			   CHECK ITEM IS NOT ALREADY IN THIS BAY
			================================================= */

			const existingResult =
				await pool.query(
					`
					SELECT
						id

					FROM modular_items

					WHERE
						modular_bay_id = $1
						AND item_id = $2

					LIMIT 1
					`,
					[
						bayId,
						cleanItemId
					]
				);


			if (
				existingResult.rows.length
			) {

				return res.status(409).json({
					error:
						'This product is already assigned to this bay.'
				});

			}


			/* =================================================
			   FIND NEXT SHELF ORDER
			================================================= */

			const shelfOrderResult =
				await pool.query(
					`
					SELECT
						COALESCE(
							MAX(shelf_order),
							0
						) + 1 AS next_order

					FROM modular_items

					WHERE
						modular_bay_id = $1
						AND shelf = $2
					`,
					[
						bayId,
						cleanShelf
					]
				);


			const shelfOrder =
				Number(
					shelfOrderResult.rows[0]
						.next_order
				);


			/* =================================================
			   INSERT MODULAR ITEM
			================================================= */

			const result =
				await pool.query(
					`
					INSERT INTO modular_items (
						modular_bay_id,
						item_id,
						upc,
						shelf,
						facings,
						shelf_order,
						max_shelf
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

					RETURNING
						id,
						modular_bay_id,
						item_id,
						upc,
						shelf,
						facings,
						shelf_order,
						max_shelf
					`,
					[
						bayId,
						cleanItemId,
						item.upc,
						cleanShelf,
						cleanFacings,
						shelfOrder,
						cleanMaxShelf
					]
				);


			const row =
				result.rows[0];


			res.status(201).json({

				modularItemId:
					row.id,

				itemId:
					row.item_id,

				upc:
					row.upc,

				description:
					item.description,

				image:
					item.image_url
						? {
							url:
								item.image_url,

							alt:
								item.image_alt ||
								item.description
						}
						: null,

				shelf:
					row.shelf,

				facings:
					row.facings,

				shelfOrder:
					row.shelf_order,

				maxShelf:
					row.max_shelf,

				bayId:
					row.modular_bay_id

			});


		} catch (error) {

			console.error(
				'Unable to add modular bay item:',
				error
			);


			res.status(500).json({
				error:
					'Unable to add item to modular bay.'
			});

		}

	}
);


/* =========================================================
   UPDATE MODULAR BAY ITEM
========================================================= */

router.put(
	'/admin/modular-activity/bay-items/:id',
	async (req, res) => {

		const id =
			Number(
				req.params.id
			);


		const {
			shelf,
			shelfOrder,
			maxShelf,
			facings
		} = req.body;


		const cleanShelf =
			String(
				shelf || ''
			).trim();


		const cleanShelfOrder =
			Number(
				shelfOrder
			);


		const cleanMaxShelf =
			Number(
				maxShelf
			);


		const cleanFacings =
			Number(
				facings
			);


		if (
			!Number.isInteger(id)
		) {

			return res.status(400).json({
				error:
					'Invalid modular item ID.'
			});

		}


		if (!cleanShelf) {

			return res.status(400).json({
				error:
					'Shelf is required.'
			});

		}


		if (
			!Number.isInteger(
				cleanShelfOrder
			) ||
			cleanShelfOrder < 1
		) {

			return res.status(400).json({
				error:
					'Shelf order must be a valid whole number of at least 1.'
			});

		}


		if (
			!Number.isInteger(
				cleanMaxShelf
			) ||
			cleanMaxShelf < 0
		) {

			return res.status(400).json({
				error:
					'Max shelf must be a valid whole number.'
			});

		}


		if (
			!Number.isInteger(
				cleanFacings
			) ||
			cleanFacings < 1
		) {

			return res.status(400).json({
				error:
					'Facings must be at least 1.'
			});

		}


		const client =
			await pool.connect();


		try {

			await client.query(
				'BEGIN'
			);


			/* =================================================
			   FIND EXISTING MODULAR ITEM
			================================================= */

			const existingResult =
				await client.query(
					`
					SELECT
						id,
						modular_bay_id,
						shelf,
						shelf_order

					FROM modular_items

					WHERE
						id = $1

					FOR UPDATE
					`,
					[
						id
					]
				);


			if (
				!existingResult.rows.length
			) {

				await client.query(
					'ROLLBACK'
				);


				return res.status(404).json({
					error:
						'Modular item not found.'
				});

			}


			const existing =
				existingResult.rows[0];


			const oldShelf =
				existing.shelf;


			const oldShelfOrder =
				Number(
					existing.shelf_order
				);


			const bayId =
				existing.modular_bay_id;


			/* =================================================
			   COUNT ITEMS ON TARGET SHELF

			   This tells us the highest valid position
			   before inserting the item into the sequence.
			================================================= */

			const targetCountResult =
				await client.query(
					`
					SELECT
						COUNT(*) AS item_count

					FROM modular_items

					WHERE
						modular_bay_id = $1
						AND shelf = $2
						AND id <> $3
					`,
					[
						bayId,
						cleanShelf,
						id
					]
				);


			const targetCount =
				Number(
					targetCountResult.rows[0]
						.item_count
				);


			/* =================================================
			   LIMIT ORDER TO THE NEXT AVAILABLE POSITION

			   Example:

			   Existing:
			   1
			   2
			   3

			   Requested:
			   99

			   Result:
			   1
			   2
			   3
			   4
			================================================= */

			const targetOrder =
				Math.min(
					cleanShelfOrder,
					targetCount + 1
				);


			/* =================================================
			   MOVE TO A DIFFERENT SHELF
			================================================= */

			if (
				oldShelf !== cleanShelf
			) {

				/* =============================================
				   CLOSE THE GAP ON THE OLD SHELF

				   Example:

				   Old shelf:
				   1
				   2  <- moving this
				   3

				   Becomes:

				   1
				   2
				============================================= */

				await client.query(
					`
					UPDATE modular_items

					SET
						shelf_order =
							shelf_order - 1

					WHERE
						modular_bay_id = $1
						AND shelf = $2
						AND shelf_order > $3
					`,
					[
						bayId,
						oldShelf,
						oldShelfOrder
					]
				);


				/* =============================================
				   MAKE SPACE ON NEW SHELF

				   Example:

				   Target:
				   1
				   2
				   3

				   Moving item into 2:

				   1
				   2 <- new item
				   3
				   4
				============================================= */

				await client.query(
					`
					UPDATE modular_items

					SET
						shelf_order =
							shelf_order + 1

					WHERE
						modular_bay_id = $1
						AND shelf = $2
						AND shelf_order >= $3
					`,
					[
						bayId,
						cleanShelf,
						targetOrder
					]
				);

			}


			/* =================================================
			   MOVE WITHIN THE SAME SHELF
			================================================= */

			else {

				if (
					targetOrder < oldShelfOrder
				) {

					/* =========================================
					   MOVING UP

					   Example:

					   1
					   2
					   3
					   4

					   Move 4 -> 2

					   Becomes:

					   1
					   2 <- moved item
					   3
					   4
					========================================= */

					await client.query(
						`
						UPDATE modular_items

						SET
							shelf_order =
								shelf_order + 1

						WHERE
							modular_bay_id = $1
							AND shelf = $2
							AND id <> $3
							AND shelf_order >= $4
							AND shelf_order < $5
						`,
						[
							bayId,
							cleanShelf,
							id,
							targetOrder,
							oldShelfOrder
						]
					);

				}


				else if (
					targetOrder > oldShelfOrder
				) {

					/* =========================================
					   MOVING DOWN

					   Example:

					   1
					   2
					   3
					   4

					   Move 2 -> 4

					   Becomes:

					   1
					   2
					   3
					   4 <- moved item
					========================================= */

					await client.query(
						`
						UPDATE modular_items

						SET
							shelf_order =
								shelf_order - 1

						WHERE
							modular_bay_id = $1
							AND shelf = $2
							AND id <> $3
							AND shelf_order > $4
							AND shelf_order <= $5
						`,
						[
							bayId,
							cleanShelf,
							id,
							oldShelfOrder,
							targetOrder
						]
					);

				}

			}


			/* =================================================
			   UPDATE THE ITEM ITSELF
			================================================= */

			const result =
				await client.query(
					`
					UPDATE modular_items

					SET
						shelf = $1,
						max_shelf = $2,
						facings = $3,
						shelf_order = $4

					WHERE
						id = $5

					RETURNING
						id,
						modular_bay_id,
						item_id,
						upc,
						shelf,
						facings,
						shelf_order,
						max_shelf
					`,
					[
						cleanShelf,
						cleanMaxShelf,
						cleanFacings,
						targetOrder,
						id
					]
				);


			const row =
				result.rows[0];


			/* =================================================
			   GET PRODUCT DETAILS
			================================================= */

			const itemResult =
				await client.query(
					`
					SELECT
						description,
						image_url,
						image_alt

					FROM items

					WHERE
						id = $1
					`,
					[
						row.item_id
					]
				);


			const item =
				itemResult.rows[0];


			/* =================================================
			   REBUILD SHELF ORDERS

			   This guarantees that the shelf can never end up
			   with gaps such as:

			   1
			   4
			   5
			   6

			   Instead it is always:

			   1
			   2
			   3
			   4
			================================================= */

			await client.query(
				`
				WITH numbered AS (

					SELECT
						id,

						ROW_NUMBER() OVER (
							ORDER BY
								shelf_order,
								id
						) AS new_order

					FROM modular_items

					WHERE
						modular_bay_id = $1
						AND shelf = $2

				)

				UPDATE modular_items mi

				SET
					shelf_order =
						numbered.new_order

				FROM numbered

				WHERE
					mi.id = numbered.id
				`,
				[
					bayId,
					cleanShelf
				]
			);


			/* =================================================
			   GET FINAL ORDER OF UPDATED ITEM
			================================================= */

			const finalResult =
				await client.query(
					`
					SELECT
						id,
						modular_bay_id,
						item_id,
						upc,
						shelf,
						facings,
						shelf_order,
						max_shelf

					FROM modular_items

					WHERE
						id = $1
					`,
					[
						id
					]
				);


			const finalRow =
				finalResult.rows[0];


			/* =================================================
			   COMMIT
			================================================= */

			await client.query(
				'COMMIT'
			);


			res.json({

				modularItemId:
					finalRow.id,

				itemId:
					finalRow.item_id,

				upc:
					finalRow.upc,

				description:
					item.description,

				image:
					item.image_url
						? {
							url:
								item.image_url,

							alt:
								item.image_alt ||
								item.description
						}
						: null,

				shelf:
					finalRow.shelf,

				facings:
					finalRow.facings,

				shelfOrder:
					finalRow.shelf_order,

				maxShelf:
					finalRow.max_shelf,

				bayId:
					finalRow.modular_bay_id

			});


		} catch (error) {

			await client.query(
				'ROLLBACK'
			);


			console.error(
				'Unable to update modular bay item:',
				error
			);


			res.status(500).json({
				error:
					'Unable to update modular bay item.'
			});


		} finally {

			client.release();

		}

	}
);


/* =========================================================
   DELETE MODULAR BAY ITEM
========================================================= */

router.delete(
	'/admin/modular-activity/bay-items/:id',
	async (req, res) => {

		const id =
			Number(
				req.params.id
			);


		if (
			!Number.isInteger(id)
		) {

			return res.status(400).json({
				error:
					'Invalid modular item ID.'
			});

		}


		try {

			const result =
				await pool.query(
					`
					DELETE FROM modular_items

					WHERE id = $1

					RETURNING
						id,
						modular_bay_id,
						item_id,
						upc
					`,
					[
						id
					]
				);


			if (
				!result.rows.length
			) {

				return res.status(404).json({
					error:
						'Modular item not found.'
				});

			}


			const row =
				result.rows[0];


			res.json({

				success:
					true,

				modularItemId:
					row.id,

				bayId:
					row.modular_bay_id,

				itemId:
					row.item_id,

				upc:
					row.upc

			});


		} catch (error) {

			console.error(
				'Unable to delete modular bay item:',
				error
			);


			res.status(500).json({
				error:
					'Unable to delete modular bay item.'
			});

		}

	}
);
/* =========================================================
   GET MODULAR ACTIVITY DATES
========================================================= */

router.get(
	'/modular-activity/dates',
	async (req, res) => {

		try {

			const result =
				await pool.query(`
					SELECT
						TO_CHAR(
							due_date,
							'DD/MM/YYYY'
						) AS due_date

					FROM (
						SELECT DISTINCT
							ma.due_date::date AS due_date

						FROM modular_activity ma

						INNER JOIN modular_bays mb
							ON ma.planogram_number = mb.id

						WHERE mb.modular_id IS NULL
					) dates

					ORDER BY
						due_date;
				`);


			res.json(
				result.rows
			);

		} catch (error) {

			console.error(
				'Unable to load modular activity dates:',
				error
			);

			res.status(500).json({
				error:
					'Unable to load modular activity dates.'
			});

		}

	}
);


/* =========================================================
   GET MODULAR ACTIVITY
========================================================= */

/* =========================================================
   GET MODULAR ACTIVITY
========================================================= */

router.get(
	'/modular-activity',
	async (req, res) => {

		try {

			const {
				dueDates,
				upc
			} = req.query;


			let query = `
				SELECT
					ma.modular_name,
					ma.department_number,
					TO_CHAR(
						ma.due_date,
						'DD/MM/YYYY'
					) AS due_date,
					ma.planogram_number

				FROM modular_activity ma

				INNER JOIN modular_bays mb
					ON ma.planogram_number = mb.id

				WHERE mb.modular_id IS NULL
			`;


			const values = [];


			/* =====================================================
			   FILTER BY SELECTED DUE DATES
			===================================================== */

			if (dueDates) {

				const dates =
					dueDates
						.split(',')
						.filter(Boolean);


				if (dates.length) {

					values.push(
						dates
					);


					query += `
						AND ma.due_date::date =
							ANY($${values.length}::date[])
					`;

				}

			}


			/* =====================================================
			   FILTER BY UPC
			===================================================== */

			if (upc) {

				values.push(
					String(upc).trim()
				);


				query += `
					AND EXISTS (
						SELECT 1

						FROM modular_items mi

						WHERE
							mi.modular_bay_id = mb.id
							AND mi.upc = $${values.length}
					)
				`;

			}


			/* =====================================================
			   ORDER
			===================================================== */

			query += `
				ORDER BY
					ma.due_date,
					ma.planogram_number;
			`;


			const result =
				await pool.query(
					query,
					values
				);


			res.json(
				result.rows
			);

		} catch (error) {

			console.error(
				'Unable to load modular activity:',
				error
			);

			res.status(500).json({
				error:
					'Unable to load modular activity.'
			});

		}

	}
);
/* =========================================================
   GET MODULAR BAY PRODUCTS
========================================================= */

router.get(
	'/modular-bay/:planogramNumber',
	async (req, res) => {

		const planogramNumber =
			req.params.planogramNumber;

		try {

			const result =
	await pool.query(
		`
		SELECT
			mi.id AS modular_item_id,

			mi.item_id,

			mi.upc,

			mi.shelf,

			mi.facings,

			mi.shelf_order,

			mi.max_shelf,

			i.description,

			i.image_url,

			i.image_alt,

			mb.id AS bay_id,

			mb.bay_number,

			mb.planogram_number,

			mb.modular_id

		FROM modular_bays mb

		INNER JOIN modular_items mi
			ON mi.modular_bay_id = mb.id

		INNER JOIN items i
			ON i.id = mi.item_id

		WHERE
			mb.planogram_number = $1

		ORDER BY
			CAST(
					mb.bay_number AS INTEGER
				),

			CAST(
				NULLIF(
					REGEXP_REPLACE(
						mi.shelf,
						'[^0-9]',
						'',
						'g'
					),
					''
				) AS INTEGER
			),

			mi.shelf_order
		`,
		[
			planogramNumber
		]
	);


			res.json(
	result.rows.map(
		row => ({

			modularItemId:
				row.modular_item_id,

			itemId:
				row.item_id,

			upc:
				row.upc,

			description:
				row.description,

			image:
				row.image_url
					? {
						url:
							row.image_url,

						alt:
							row.image_alt ||
							row.description
					}
					: null,

			shelf:
				row.shelf,
			facings:
				row.facings,

			shelfOrder:
				row.shelf_order,

			maxShelf:
				row.max_shelf,

			planogramNumber:
				row.planogram_number,

			bayNumber:
				row.bay_number,

			bayId:
				row.bay_id,

			modularId:
				row.modular_id

		})
	)
);

		} catch (error) {

			console.error(
				'Failed to load modular bay products:',
				error
			);

			res.status(500).json({
				error:
					'Failed to load modular bay products.'
			});

		}

	}
);
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

	const originalUpc =
		String(req.params.upc || '').trim();

	const {
		upc: newUpc,
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


	const cleanNewUpc =
		String(newUpc || '').trim();


	try {

		/* =====================================================
		   FIND EXISTING PRODUCT
		===================================================== */

		const existingResult =
			await pool.query(`
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
				originalUpc
			]);


		if (!existingResult.rows.length) {

			return res.status(404).json({
				error: 'Product not found'
			});

		}


		const existingItem =
			existingResult.rows[0];


		/* =====================================================
		   UPC IS REQUIRED
		===================================================== */

		if (!cleanNewUpc) {

			return res.status(400).json({
				error: 'UPC is required.'
			});

		}


		/* =====================================================
		   CHECK WHETHER UPC HAS CHANGED
		===================================================== */

		const upcHasChanged =
			existingItem.upc !== cleanNewUpc;


		/* =====================================================
		   IF UPC CHANGED, MAKE SURE NEW UPC IS AVAILABLE
		===================================================== */

		if (upcHasChanged) {

			const duplicateResult =
				await pool.query(`
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
					cleanNewUpc
				]);


			if (
				duplicateResult.rows.length &&
				duplicateResult.rows[0].id !== existingItem.id
			) {

				return res.status(409).json({
					error:
						'That UPC is already assigned to another item.'
				});

			}

		}


		/* =====================================================
		   UPDATE EXISTING ITEM
		   
		   IMPORTANT:
		   The existing item ID is preserved.
		   
		   Therefore:
		   - modulars remain linked
		   - sales history remains linked
		   - other foreign keys remain linked
		===================================================== */

		const result =
			await pool.query(`
				UPDATE items

				SET
					upc = $1,

					description =
						COALESCE($2, description),

					on_hand =
						COALESCE($3, on_hand),

					price =
						COALESCE($4, price),

					case_size =
						COALESCE($5, case_size),

					weight =
						COALESCE($6, weight),

					item_number =
						COALESCE($7, item_number),

					max_shelf =
						COALESCE($8, max_shelf),

					department =
						COALESCE($9, department),

					image_url =
						COALESCE($10, image_url),

					image_alt =
						COALESCE($11, image_alt),

					case_barcode =
						COALESCE($12, case_barcode),

					alternative_barcode =
						COALESCE($13, alternative_barcode),

					hffss_status =
						COALESCE($14, hffss_status),

					range_status =
						COALESCE($15, range_status),

					updated_at =
						CURRENT_TIMESTAMP

				WHERE id = $16

				RETURNING *
			`, [

				cleanNewUpc,       // $1
				description,       // $2
				onHand,            // $3
				price,             // $4
				caseSize,          // $5
				weight,             // $6
				itemNumber,        // $7
				maxShelf,          // $8
				department,        // $9
				imageUrl || null,  // $10
				imageAlt || null,  // $11
				caseBarcode,       // $12
				alternativeBarcode,// $13
				hffssStatus,       // $14
				rangeStatus,       // $15

				/* Existing database ID */
				existingItem.id    // $16
			]);


		if (!result.rows.length) {

			return res.status(404).json({
				error: 'Product not found'
			});

		}


		/* =====================================================
		   RESPONSE
		===================================================== */

		res.json(
			formatItem(
				result.rows[0]
			)
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


		/* =====================================================
		   POSTGRES UNIQUE CONSTRAINT
		===================================================== */

		if (error.code === '23505') {

			return res.status(409).json({
				error:
					'That barcode is already assigned to another item.'
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

/* =========================================================
   DELETE PRODUCT
========================================================= */

router.delete('/:upc', async (req, res) => {

	const { upc } = req.params;


	try {

		/* =====================================================
		   FIND PRODUCT
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
		   DELETE PRODUCT
		   
		   Because the database relationships use
		   ON DELETE CASCADE, this will also remove:
		   
		   - modulars
		   - item_sales_daily
		   - modular_items
		   ===================================================== */

		const result =
			await pool.query(`
				DELETE FROM items
				WHERE id = $1
				RETURNING id, upc
			`, [
				item.id
			]);


		if (!result.rows.length) {

			return res.status(404).json({
				error: 'Product not found'
			});

		}


		res.json({
			success: true,
			upc: result.rows[0].upc
		});


	} catch (error) {

		console.error(
			'Failed to delete product:',
			error
		);


		res.status(500).json({
			error: 'Failed to delete product'
		});

	}

});

module.exports = router;