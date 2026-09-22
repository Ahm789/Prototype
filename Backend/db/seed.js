const pool = require('./pool');


/* =========================================================
   ITEMS
========================================================= */

const items = [

	{
		id: 8,
		upc: '9900000000080',
		description: 'ASDA 4 Battered Cod Fillets 440g',
		onHand: 0,
		price: 7.50,
		caseSize: 0,
		itemNumber: '990000008',
		maxShelf: 0,
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5063089700778?$ProdListProd$'
	},

	{
		id: 12,
		upc: '9900000000127',
		description: 'ASDA Party Food 2 Mature Cheddar & Spring Onion Bakes 230g',
		onHand: 0,
		price: 2.17,
		caseSize: 0,
		itemNumber: '990000012',
		maxShelf: 0,
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5057172100675?$ProdListProd$'
	},

	{
		id: 3,
		upc: '9900000000035',
		description: 'ASDA Frozen Garden Peas 1kg',
		onHand: 0,
		price: 1.50,
		caseSize: 0,
		itemNumber: '990000003',
		maxShelf: 0,
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5050854264498_T1'
	},

	{
		id: 13,
		upc: '05060198649592',
		description: 'Crostam Garlic Flatbread',
		onHand: 13,
		price: 2.50,
		caseSize: 0,
		itemNumber: '100543572',
		maxShelf: 14,
		imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRk1iGjgeKF7KRduJuDDDcJqSh1h21kTbKAz73-LuyqAA&s'
	},

	{
		id: 2,
		upc: '9900000000028',
		description: 'ASDA Seasoned Sweet Potato Fries 500g',
		onHand: 0,
		price: 2.20,
		caseSize: 0,
		itemNumber: '990000002',
		maxShelf: 0,
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5054781734895?$ProdListProd$'
	},

	{
		id: 5,
		upc: '9900000000059',
		description: 'ASDA Four Cheese Stonebaked Pizza 315g',
		onHand: 0,
		price: 1.72,
		caseSize: 0,
		itemNumber: '990000005',
		maxShelf: 0,
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/T_5063089839096?$ProdListProd$'
	},

	{
		id: 7,
		upc: '9900000000073',
		description: 'Free From by ASDA 20 Chicken Nuggets 400g',
		onHand: 0,
		price: 4.00,
		caseSize: 0,
		itemNumber: '990000007',
		maxShelf: 0,
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5063089794227?$ProdListProd$'
	},

	{
		id: 9,
		upc: '9900000000097',
		description: 'Tiger Tiger Dumpling Pastry 300g',
		onHand: 0,
		price: 2.50,
		caseSize: 0,
		itemNumber: '990000009',
		maxShelf: 0,
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5024448572061?$ProdListProd$'
	},

	{
		id: 10,
		upc: '9900000000103',
		description: 'Cornetto MAX Hazelnut & Chocolate Ice Cream Cones 4x90ml',
		onHand: 0,
		price: 4.00,
		caseSize: 0,
		itemNumber: '990000010',
		maxShelf: 0,
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/8711327680685?$ProdListProd$'
	},

	{
		id: 11,
		upc: '9900000000110',
		description: 'Twister Mini Pineapple Ice Cream Lollies 6x50g',
		onHand: 0,
		price: 2.74,
		caseSize: 0,
		itemNumber: '990000011',
		maxShelf: 0,
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/8721274803761?$ProdListProd$'
	},

	{
		id: 93,
		upc: '4001724008743',
		description: 'Chicago Town Subs Cheese & Tomato 250g',
		onHand: 25,
		price: 1.90,
		caseSize: 10,
		itemNumber: '100161921',
		maxShelf: 42,
		imageUrl: 'https://m.media-amazon.com/images/I/81iA6IN3o2L._AC_UF1000,1000_QL80_.jpg'
	},

	{
		id: 96,
		upc: '400900547680',
		description: 'Wrigley’s Extra Spearmint Sugar-Free Gum 46 pack',
		onHand: 0,
		price: 2.45,
		caseSize: 6,
		itemNumber: '100154854',
		maxShelf: 0,
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/4009900547680_T1?$PDPImageProd$'
	},

	{
		id: 6,
		upc: '9900000000066',
		description: 'ASDA Chicken Breast Strips 500g',
		onHand: 0,
		price: 4.58,
		caseSize: 0,
		itemNumber: '990000006',
		maxShelf: 0,
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5063089891636?$ProdListProd$'
	},

	{
		id: 1,
		upc: '9900000000011',
		description: 'ASDA Crispy Skin-On Fries 750g',
		onHand: 96,
		price: 2.20,
		caseSize: 12,
		itemNumber: '990000001',
		maxShelf: 96,
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5057172606085?$ProdListProd$'
	},

	{
		id: 4,
		upc: '9900000000042',
		description: 'ASDA Double Pepperoni Stonebaked Pizza 309g',
		onHand: 72,
		price: 1.72,
		caseSize: 7,
		itemNumber: '990000004',
		maxShelf: 72,
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/T_5063089839119?$ProdListProd$'
	}

];


/* =========================================================
   MODULAR DATA
========================================================= */

const modulars = [

	{
		itemId: 1,
		aisle: '15',
		aisleSide: 'L',
		bay: '3',
		shelf: '1',
		modularId: 'FF-15-L-3',
		isPrimary: true
	},

	{
		itemId: 2,
		aisle: '15',
		aisleSide: 'L',
		bay: '3',
		shelf: '1',
		modularId: 'FF-15-L-3',
		isPrimary: true
	},

	{
		itemId: 3,
		aisle: '15',
		aisleSide: 'R',
		bay: '5',
		shelf: '',
		modularId: 'FF-15-R-5',
		isPrimary: true
	},

	{
		itemId: 4,
		aisle: '16',
		aisleSide: 'L',
		bay: '8',
		shelf: '1',
		modularId: 'FF-16-L-8',
		isPrimary: true
	},

	{
		itemId: 5,
		aisle: '16',
		aisleSide: 'L',
		bay: '8',
		shelf: '2',
		modularId: 'FF-16-L-8',
		isPrimary: true
	},

	{
		itemId: 6,
		aisle: '15',
		aisleSide: 'L',
		bay: '12',
		shelf: '',
		modularId: 'FF-15-L-12',
		isPrimary: true
	},

	{
		itemId: 7,
		aisle: '15',
		aisleSide: 'L',
		bay: '14',
		shelf: '',
		modularId: 'FF-15-L-14',
		isPrimary: true
	},

	{
		itemId: 8,
		aisle: '14',
		aisleSide: 'R',
		bay: '6',
		shelf: '',
		modularId: 'FF-14-R-6',
		isPrimary: true
	},

	{
		itemId: 9,
		aisle: '14',
		aisleSide: 'L',
		bay: '15',
		shelf: '',
		modularId: 'FF-14-L-15',
		isPrimary: true
	},

	{
		itemId: 10,
		aisle: '16',
		aisleSide: 'R',
		bay: '20',
		shelf: '',
		modularId: 'FF-16-R-20',
		isPrimary: true
	},

	{
		itemId: 11,
		aisle: '16',
		aisleSide: 'R',
		bay: '21',
		shelf: '1',
		modularId: 'FF-16-R-21',
		isPrimary: true
	},

	{
		itemId: 12,
		aisle: '14',
		aisleSide: 'L',
		bay: '18',
		shelf: '',
		modularId: 'FF-14-L-18',
		isPrimary: true
	},

	{
		itemId: 13,
		aisle: 'FF16',
		aisleSide: 'R',
		bay: '18',
		shelf: '2',
		modularId: 'FF-FF16-R-18-2',
		isPrimary: true
	},

	{
		itemId: 93,
		aisle: '16',
		aisleSide: 'R',
		bay: '15',
		shelf: '1',
		modularId: 'FF-16-R-15',
		isPrimary: true
	}

];


/* =========================================================
   SALES HISTORY
   CHICAGO TOWN SUBS
========================================================= */

const salesHistory = {

	93: [

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
			units: 2,
			availability: 98.19,
			sales: 3.00,
			lostSales: 0.00
		},

		{
			date: '2026-09-15',
			units: 2,
			availability: 99.00,
			sales: 3.00,
			lostSales: 0.00
		},

		{
			date: '2026-09-16',
			units: 2,
			availability: 98.70,
			sales: 3.00,
			lostSales: 0.00
		},

		{
			date: '2026-09-17',
			units: 2,
			availability: 98.50,
			sales: 3.00,
			lostSales: 0.00
		},

		{
			date: '2026-09-18',
			units: 2,
			availability: 98.40,
			sales: 3.00,
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
			units: 20,
			availability: 99.00,
			sales: 30.00,
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
		   FULL DATABASE RESET
		===================================================== */

		await client.query(`
			TRUNCATE TABLE
				item_sales_daily,
				modulars,
				items
			RESTART IDENTITY
			CASCADE
		`);


		/* =====================================================
		   INSERT ITEMS
		===================================================== */

		for (const item of items) {

			await client.query(
				`
				INSERT INTO items (
					id,
					upc,
					case_barcode,
					alternative_barcode,
					item_number,
					description,
					on_hand,
					price,
					case_size,
					max_shelf,
					department,
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
					$14
				)
				`,
				[
					item.id,
					item.upc,
					null,
					null,
					item.itemNumber,
					item.description,
					item.onHand,
					item.price,
					item.caseSize,
					item.maxShelf,
					'Frozen',
					'in-range',
					item.imageUrl,
					item.description
				]
			);

		}


		/* =====================================================
		   RESET ITEM ID SEQUENCE
		===================================================== */

		await client.query(`
			SELECT setval(
				pg_get_serial_sequence('items', 'id'),
				(
					SELECT MAX(id)
					FROM items
				)
			)
		`);


		/* =====================================================
		   INSERT MODULAR LOCATIONS
		===================================================== */

		for (const modular of modulars) {

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
				`,
				[
					modular.itemId,
					modular.aisle,
					modular.aisleSide,
					modular.bay,
					modular.shelf,
					modular.modularId,
					modular.isPrimary
				]
			);

		}


		/* =====================================================
		   INSERT SALES HISTORY
		===================================================== */

		for (
			const [itemId, dailySales]
			of Object.entries(salesHistory)
		) {

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
					`,
					[
						Number(itemId),
						day.date,
						day.units,
						day.availability,
						day.sales,
						day.lostSales
					]
				);

			}

		}


		/* =====================================================
		   COMMIT
		===================================================== */

		await client.query('COMMIT');


		console.log('');
		console.log('==============================================');
		console.log('DATABASE SEED COMPLETE');
		console.log('==============================================');
		console.log(`Items: ${items.length}`);
		console.log(`Modulars: ${modulars.length}`);
		console.log(`Chicago Town sales days: 16`);
		console.log('==============================================');
		console.log('');


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