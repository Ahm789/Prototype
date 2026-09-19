const pool = require('./pool');

const products = [
	{
		upc: '9900000000011',
		itemNumber: '990000001',
		description: 'ASDA Crispy Skin-On Fries 750g',
		price: 2.20,
		onHand: 0,
		caseSize: 0,
		maxShelf: 0,
		department: '72',
		aisle: '15',
		aisleSide: 'L',
		bay: '3',
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5057172606085?$ProdListProd$',
		modularId: 'FF-15-L-3'
	},
	{
		upc: '9900000000028',
		itemNumber: '990000002',
		description: 'ASDA Seasoned Sweet Potato Fries 500g',
		price: 2.20,
		onHand: 0,
		caseSize: 0,
		maxShelf: 0,
		department: '72',
		aisle: '15',
		aisleSide: 'L',
		bay: '4',
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5054781734895?$ProdListProd$',
		modularId: 'FF-15-L-4'
	},
	{
		upc: '9900000000035',
		itemNumber: '990000003',
		description: 'ASDA Frozen Garden Peas 1kg',
		price: 1.50,
		onHand: 0,
		caseSize: 0,
		maxShelf: 0,
		department: '72',
		aisle: '15',
		aisleSide: 'R',
		bay: '5',
		imageUrl: '',
		modularId: 'FF-15-R-5'
	},
	{
		upc: '9900000000042',
		itemNumber: '990000004',
		description: 'ASDA Double Pepperoni Stonebaked Pizza 309g',
		price: 1.72,
		onHand: 0,
		caseSize: 0,
		maxShelf: 0,
		department: '91',
		aisle: '16',
		aisleSide: 'L',
		bay: '8',
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/T_5063089839119?$ProdListProd$',
		modularId: 'FF-16-L-8'
	},
	{
		upc: '9900000000059',
		itemNumber: '990000005',
		description: 'ASDA Four Cheese Stonebaked Pizza 315g',
		price: 1.72,
		onHand: 0,
		caseSize: 0,
		maxShelf: 0,
		department: '91',
		aisle: '16',
		aisleSide: 'L',
		bay: '9',
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/T_5063089839096?$ProdListProd$',
		modularId: 'FF-16-L-9'
	},
	{
		upc: '9900000000066',
		itemNumber: '990000006',
		description: 'ASDA Chicken Breast Strips 500g',
		price: 4.58,
		onHand: 0,
		caseSize: 0,
		maxShelf: 0,
		department: '71',
		aisle: '15',
		aisleSide: 'L',
		bay: '12',
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5063089891636?$ProdListProd$',
		modularId: 'FF-15-L-12'
	},
	{
		upc: '9900000000073',
		itemNumber: '990000007',
		description: 'Free From by ASDA 20 Chicken Nuggets 400g',
		price: 4.00,
		onHand: 0,
		caseSize: 0,
		maxShelf: 0,
		department: '91',
		aisle: '15',
		aisleSide: 'L',
		bay: '14',
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5063089794227?$ProdListProd$',
		modularId: 'FF-15-L-14'
	},
	{
		upc: '9900000000080',
		itemNumber: '990000008',
		description: 'ASDA 4 Battered Cod Fillets 440g',
		price: 7.50,
		onHand: 0,
		caseSize: 0,
		maxShelf: 0,
		department: '71',
		aisle: '14',
		aisleSide: 'R',
		bay: '6',
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5063089700778?$ProdListProd$',
		modularId: 'FF-14-R-6'
	},
	{
		upc: '9900000000097',
		itemNumber: '990000009',
		description: 'Tiger Tiger Dumpling Pastry 300g',
		price: 2.50,
		onHand: 0,
		caseSize: 0,
		maxShelf: 0,
		department: '71',
		aisle: '14',
		aisleSide: 'L',
		bay: '15',
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5024448572061?$ProdListProd$',
		modularId: 'FF-14-L-15'
	},
	{
		upc: '9900000000103',
		itemNumber: '990000010',
		description: 'Cornetto MAX Hazelnut & Chocolate Ice Cream Cones 4x90ml',
		price: 4.00,
		onHand: 0,
		caseSize: 0,
		maxShelf: 0,
		department: '73',
		aisle: '16',
		aisleSide: 'R',
		bay: '20',
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/8711327680685?$ProdListProd$',
		modularId: 'FF-16-R-20'
	},
	{
		upc: '9900000000110',
		itemNumber: '990000011',
		description: 'Twister Mini Pineapple Ice Cream Lollies 6x50ml',
		price: 2.74,
		onHand: 0,
		caseSize: 0,
		maxShelf: 0,
		department: '73',
		aisle: '16',
		aisleSide: 'R',
		bay: '21',
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/8721274803761?$ProdListProd$',
		modularId: 'FF-16-R-21'
	},
	{
		upc: '9900000000127',
		itemNumber: '990000012',
		description: 'ASDA Party Food 2 Mature Cheddar & Spring Onion Bakes 230g',
		price: 2.17,
		onHand: 0,
		caseSize: 0,
		maxShelf: 0,
		department: '91',
		aisle: '14',
		aisleSide: 'L',
		bay: '18',
		imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5057172100675?$ProdListProd$',
		modularId: 'FF-14-L-18'
	},
	{
		upc: '05060198649592',
		itemNumber: '100543572',
		description: 'Crostam Garlic Flatbread',
		price: 2.50,
		onHand: 12,
		caseSize: 0,
		maxShelf: 14,
		department: 'Bakery & Frozen',
		aisle: 'FF16',
		aisleSide: 'R',
		bay: '18',
		imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=320&q=80',
		modularId: 'FF-FF16-R-18-2'
	}
];

async function seed() {
	const client = await pool.connect();

	try {
		await client.query('BEGIN');

		for (const product of products) {
			await client.query(
				`
				INSERT INTO items (
					upc,
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
				VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
				ON CONFLICT (upc)
				DO UPDATE SET
					item_number = EXCLUDED.item_number,
					description = EXCLUDED.description,
					price = EXCLUDED.price,
					department = EXCLUDED.department,
					range_status = EXCLUDED.range_status,
					image_url = EXCLUDED.image_url,
					image_alt = EXCLUDED.image_alt,
					updated_at = CURRENT_TIMESTAMP
				`,
				[
					product.upc,
					product.itemNumber,
					product.description,
					product.onHand,
					product.price,
					product.caseSize,
					product.maxShelf,
					product.department,
					'in-range',
					product.imageUrl,
					product.description
				]
			);

			await client.query(
				`
				INSERT INTO modulars (
					upc,
					aisle,
					aisle_side,
					bay,
					shelf,
					modular_id,
					is_primary
				)
				VALUES ($1,$2,$3,$4,$5,$6,$7)
				ON CONFLICT DO NOTHING
				`,
				[
					product.upc,
					product.aisle,
					product.aisleSide,
					product.bay,
					product.upc === '05060198649592' ? '2' : '',
					product.modularId,
					true
				]
			);
		}

		await client.query('COMMIT');

		console.log(`Seed complete: ${products.length} products inserted/updated.`);
	} catch (error) {
		await client.query('ROLLBACK');
		console.error('Seed failed:', error);
	} finally {
		client.release();
		await pool.end();
	}
}

seed();