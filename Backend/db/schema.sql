CREATE TABLE IF NOT EXISTS items (
	id SERIAL PRIMARY KEY,

	-- Main/product barcode
	upc VARCHAR(32) NOT NULL UNIQUE,

	-- Optional additional barcodes for the same item
	case_barcode VARCHAR(32) UNIQUE,

	alternative_barcode VARCHAR(32) UNIQUE,

	description TEXT NOT NULL,

	on_hand INTEGER NOT NULL DEFAULT 0,

	price NUMERIC(10, 2) NOT NULL DEFAULT 0,

	case_size INTEGER NOT NULL DEFAULT 0,

	weight TEXT,

	item_number VARCHAR(64),

	max_shelf INTEGER NOT NULL DEFAULT 0,

	department VARCHAR(64),

	range_status VARCHAR(32) DEFAULT 'in-range',

	hffss_status VARCHAR(20) NOT NULL DEFAULT 'Compliant',

	CONSTRAINT check_hffss_status
		CHECK (hffss_status IN ('Compliant', 'Not Compliant')),

	image_url TEXT,

	image_alt TEXT,

	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


/* =========================================================
   PREVENT DUPLICATE BARCODES
========================================================= */

CREATE OR REPLACE FUNCTION prevent_duplicate_barcodes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN

	IF NEW.upc IS NOT NULL
		AND (
			NEW.upc = NEW.case_barcode
			OR NEW.upc = NEW.alternative_barcode
		)
	THEN
		RAISE EXCEPTION
			'Barcode cannot be duplicated within the same item.';
	END IF;


	IF NEW.case_barcode IS NOT NULL
		AND NEW.case_barcode = NEW.alternative_barcode
	THEN
		RAISE EXCEPTION
			'Barcode cannot be duplicated within the same item.';
	END IF;


	IF EXISTS (
		SELECT 1
		FROM items
		WHERE id <> COALESCE(NEW.id, 0)
		AND (
			NEW.upc = upc
			OR NEW.upc = case_barcode
			OR NEW.upc = alternative_barcode

			OR NEW.case_barcode = upc
			OR NEW.case_barcode = case_barcode
			OR NEW.case_barcode = alternative_barcode

			OR NEW.alternative_barcode = upc
			OR NEW.alternative_barcode = case_barcode
			OR NEW.alternative_barcode = alternative_barcode
		)
	)
	THEN
		RAISE EXCEPTION
			'Barcode already exists on another item.';
	END IF;


	RETURN NEW;

END;
$$;


DROP TRIGGER IF EXISTS prevent_duplicate_barcodes_trigger
ON items;


CREATE TRIGGER prevent_duplicate_barcodes_trigger
BEFORE INSERT OR UPDATE OF upc, case_barcode, alternative_barcode
ON items
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_barcodes();


CREATE TABLE IF NOT EXISTS modulars (
	id SERIAL PRIMARY KEY,

	-- Permanent link to the item
	item_id INTEGER NOT NULL,

	aisle VARCHAR(32),

	aisle_side VARCHAR(8),

	bay VARCHAR(32),

	shelf VARCHAR(32),

	modular_id VARCHAR(128) NOT NULL,

	is_primary BOOLEAN NOT NULL DEFAULT FALSE,

	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	CONSTRAINT fk_modular_item
		FOREIGN KEY (item_id)
		REFERENCES items(id)
		ON DELETE CASCADE,

	CONSTRAINT unique_item_modular
		UNIQUE (item_id, modular_id)
);


CREATE INDEX IF NOT EXISTS idx_modulars_item_id
ON modulars(item_id);


CREATE INDEX IF NOT EXISTS idx_items_description
ON items(description);


CREATE INDEX IF NOT EXISTS idx_items_upc
ON items(upc);


CREATE INDEX IF NOT EXISTS idx_items_case_barcode
ON items(case_barcode);


CREATE INDEX IF NOT EXISTS idx_items_alternative_barcode
ON items(alternative_barcode);