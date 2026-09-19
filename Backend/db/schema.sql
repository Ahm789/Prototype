CREATE TABLE IF NOT EXISTS items (
	id SERIAL PRIMARY KEY,

	upc VARCHAR(32) NOT NULL UNIQUE,

	description TEXT NOT NULL,

	on_hand INTEGER NOT NULL DEFAULT 0,

	price NUMERIC(10, 2) NOT NULL DEFAULT 0,

	case_size INTEGER NOT NULL DEFAULT 0,

	item_number VARCHAR(64),

	max_shelf INTEGER NOT NULL DEFAULT 0,

	department VARCHAR(64),

	range_status VARCHAR(32) DEFAULT 'in-range',

	image_url TEXT,

	image_alt TEXT,

	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS modulars (
	id SERIAL PRIMARY KEY,

	upc VARCHAR(32) NOT NULL,

	aisle VARCHAR(32),

	aisle_side VARCHAR(8),

	bay VARCHAR(32),

	shelf VARCHAR(32),

	modular_id VARCHAR(128),

	is_primary BOOLEAN NOT NULL DEFAULT FALSE,

	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	CONSTRAINT fk_modular_item
		FOREIGN KEY (upc)
		REFERENCES items(upc)
		ON DELETE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_modulars_upc
ON modulars(upc);


CREATE INDEX IF NOT EXISTS idx_items_description
ON items(description);


CREATE INDEX IF NOT EXISTS idx_items_upc
ON items(upc);