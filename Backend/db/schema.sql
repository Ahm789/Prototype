/* =========================================================
   ITEMS
========================================================= */

CREATE TABLE IF NOT EXISTS items (
	id SERIAL PRIMARY KEY,

	upc VARCHAR(32) NOT NULL UNIQUE,

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
		CHECK (
			hffss_status IN (
				'Compliant',
				'Not Compliant'
			)
		),

	image_url TEXT,

	image_alt TEXT,

	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


/* =========================================================
   DAILY ITEM SALES
========================================================= */

CREATE TABLE IF NOT EXISTS item_sales_daily (
	id SERIAL PRIMARY KEY,

	item_id INTEGER NOT NULL,

	sales_date DATE NOT NULL,

	units_sold INTEGER NOT NULL DEFAULT 0,

	availability_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,

	sales_value NUMERIC(10, 2) NOT NULL DEFAULT 0,

	lost_sales NUMERIC(10, 2) NOT NULL DEFAULT 0,

	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	CONSTRAINT fk_sales_item
		FOREIGN KEY (item_id)
		REFERENCES items(id)
		ON DELETE CASCADE,

	CONSTRAINT unique_item_sales_date
		UNIQUE (item_id, sales_date)
);


/* =========================================================
   PREVENT DUPLICATE BARCODES / ASDA ITEM NUMBERS
========================================================= */

CREATE OR REPLACE FUNCTION prevent_duplicate_barcodes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN

	/* =====================================================
	   CHECK WITHIN THE SAME ITEM
	===================================================== */

	IF NEW.upc IS NOT NULL
		AND (
			NEW.upc = NEW.case_barcode
			OR NEW.upc = NEW.alternative_barcode
			OR NEW.upc = NEW.item_number
		)
	THEN
		RAISE EXCEPTION
			'UPC cannot match another identifier on the same item.';
	END IF;


	IF NEW.case_barcode IS NOT NULL
		AND (
			NEW.case_barcode = NEW.alternative_barcode
			OR NEW.case_barcode = NEW.item_number
		)
	THEN
		RAISE EXCEPTION
			'Case barcode cannot match another identifier on the same item.';
	END IF;


	IF NEW.alternative_barcode IS NOT NULL
		AND NEW.alternative_barcode = NEW.item_number
	THEN
		RAISE EXCEPTION
			'Alternative barcode cannot match the item number on the same item.';
	END IF;


	/* =====================================================
	   CHECK AGAINST OTHER ITEMS
	===================================================== */

	IF EXISTS (
		SELECT 1
		FROM items
		WHERE id <> COALESCE(NEW.id, 0)

		AND (
			NEW.upc = upc
			OR NEW.upc = case_barcode
			OR NEW.upc = alternative_barcode
			OR NEW.upc = item_number

			OR NEW.case_barcode = upc
			OR NEW.case_barcode = case_barcode
			OR NEW.case_barcode = alternative_barcode
			OR NEW.case_barcode = item_number

			OR NEW.alternative_barcode = upc
			OR NEW.alternative_barcode = case_barcode
			OR NEW.alternative_barcode = alternative_barcode
			OR NEW.alternative_barcode = item_number

			OR NEW.item_number = upc
			OR NEW.item_number = case_barcode
			OR NEW.item_number = alternative_barcode
			OR NEW.item_number = item_number
		)
	)
	THEN
		RAISE EXCEPTION
			'Barcode or Asda item number already exists on another item.';
	END IF;


	RETURN NEW;

END;
$$;


DROP TRIGGER IF EXISTS prevent_duplicate_barcodes_trigger
ON items;


CREATE TRIGGER prevent_duplicate_barcodes_trigger
BEFORE INSERT OR UPDATE OF
	upc,
	case_barcode,
	alternative_barcode,
	item_number
ON items
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_barcodes();


/* =========================================================
   CURRENT MODULAR LOCATIONS
========================================================= */

CREATE TABLE IF NOT EXISTS modulars (
	id SERIAL PRIMARY KEY,

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


/* =========================================================
   MODULAR ACTIVITY
========================================================= */

CREATE TABLE IF NOT EXISTS modular_activity (
	id SERIAL PRIMARY KEY,

	modular_name VARCHAR(255) NOT NULL,

	planogram_number INTEGER NOT NULL,

	department_number INTEGER NOT NULL,

	due_date DATE,

	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	CONSTRAINT unique_planogram_number
		UNIQUE (planogram_number)
);


/* =========================================================
   MODULAR BAYS
========================================================= */

CREATE TABLE IF NOT EXISTS modular_bays (
	id SERIAL PRIMARY KEY,

	bay_number VARCHAR(32) NOT NULL,

	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	planogram_number INTEGER NOT NULL,

	modular_id INTEGER,

	status TEXT,

	last_updated TIMESTAMP,

	CONSTRAINT fk_modular_bay_planogram
		FOREIGN KEY (planogram_number)
		REFERENCES modular_activity(planogram_number)
		ON DELETE CASCADE
);


/* =========================================================
   MODULAR ITEMS
========================================================= */

CREATE TABLE IF NOT EXISTS modular_items (
	id SERIAL PRIMARY KEY,

	item_id INTEGER NOT NULL,

	upc VARCHAR(32) NOT NULL,

	shelf VARCHAR(32),

	max_shelf INTEGER NOT NULL DEFAULT 0,

	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	modular_bay_id INTEGER NOT NULL,

	shelf_order INTEGER,

	facings INTEGER NOT NULL DEFAULT 1,

	CONSTRAINT fk_modular_items_item
		FOREIGN KEY (item_id)
		REFERENCES items(id)
		ON DELETE CASCADE,

	CONSTRAINT fk_modular_items_bay
		FOREIGN KEY (modular_bay_id)
		REFERENCES modular_bays(id)
		ON DELETE CASCADE
);


/* =========================================================
   MODULAR TAGS
========================================================= */

CREATE TABLE IF NOT EXISTS modular_tags (
	id SERIAL PRIMARY KEY,

	modular_id VARCHAR(128) NOT NULL UNIQUE,

	department VARCHAR(64),

	aisle INTEGER,

	aisle_side VARCHAR(8),

	bay INTEGER,

	active BOOLEAN NOT NULL DEFAULT TRUE,

	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


/* =========================================================
   INDEXES — MODULARS
========================================================= */

CREATE INDEX IF NOT EXISTS idx_modulars_item_id
ON modulars(item_id);


CREATE INDEX IF NOT EXISTS idx_modulars_modular_id
ON modulars(modular_id);


/* =========================================================
   INDEXES — MODULAR ACTIVITY
========================================================= */

CREATE INDEX IF NOT EXISTS idx_modular_activity_planogram
ON modular_activity(planogram_number);


CREATE INDEX IF NOT EXISTS idx_modular_activity_department
ON modular_activity(department_number);


CREATE INDEX IF NOT EXISTS idx_modular_activity_due_date
ON modular_activity(due_date);


/* =========================================================
   INDEXES — MODULAR BAYS
========================================================= */

CREATE INDEX IF NOT EXISTS idx_modular_bays_planogram
ON modular_bays(planogram_number);


CREATE INDEX IF NOT EXISTS idx_modular_bays_bay_number
ON modular_bays(bay_number);


CREATE INDEX IF NOT EXISTS idx_modular_bays_modular_id
ON modular_bays(modular_id);


CREATE INDEX IF NOT EXISTS idx_modular_bays_status
ON modular_bays(status);


CREATE INDEX IF NOT EXISTS idx_modular_bays_last_updated
ON modular_bays(last_updated);


/* =========================================================
   INDEXES — MODULAR ITEMS
========================================================= */

CREATE INDEX IF NOT EXISTS idx_modular_items_bay_id
ON modular_items(modular_bay_id);


CREATE INDEX IF NOT EXISTS idx_modular_items_item_id
ON modular_items(item_id);


CREATE INDEX IF NOT EXISTS idx_modular_items_upc
ON modular_items(upc);


/* =========================================================
   INDEXES — ITEMS
========================================================= */

CREATE INDEX IF NOT EXISTS idx_items_description
ON items(description);


CREATE INDEX IF NOT EXISTS idx_items_upc
ON items(upc);


CREATE INDEX IF NOT EXISTS idx_items_case_barcode
ON items(case_barcode);


CREATE INDEX IF NOT EXISTS idx_items_alternative_barcode
ON items(alternative_barcode);