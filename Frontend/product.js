const productBackButton =
	document.querySelector('#product-back-button');



lucide.createIcons();


const API_BASE =
	'http://localhost:3000/api/products';


const input =
	document.querySelector('#product-input');

const searchButton =
	document.querySelector('#product-search');

const productEmpty =
	document.querySelector('#product-empty');

const productResults =
	document.querySelector('#product-results');

const productSearchSection =
	document.querySelector('#product-search-section');

const productDetailView =
	document.querySelector('#product-detail-view');

const detailImage =
	document.querySelector('#detail-image');

const detailName =
	document.querySelector('#detail-name');

const detailUpc =
	document.querySelector('#detail-upc');

const detailLocCount =
	document.querySelector('#detail-loc-count');

const detailOnHand =
	document.querySelector('#detail-onhand');

const locationModules =
	document.querySelector('#location-modules');

const bayLocText =
	document.querySelector('#bay-loc-text');

const bayShelfNum =
	document.querySelector('#bay-shelf-num');

const bayImage =
	document.querySelector('#bay-image');



/* ---------------------------------------------------------
   API REQUEST
--------------------------------------------------------- */

const apiRequest = async (url) => {

	const response =
		await fetch(url);

	if (!response.ok) {

		throw new Error(
			`Request failed with status ${response.status}`
		);

	}

	return await response.json();

};



/* ---------------------------------------------------------
   LOCATION ID
--------------------------------------------------------- */

const getLocationId = (location) => {

	let aisle =
		String(location.aisle ?? '').trim();

	const side =
		String(location.aisleSide ?? '').trim();

	const bay =
		String(location.bay ?? '').trim();


	if (!aisle) {

		return 'No location';

	}


	/*
		Normalise aisle:

		16
		FF16
		FF-16

		all become:

		FF-16
	*/

	const upperAisle =
		aisle.toUpperCase();


	if (upperAisle.startsWith('FF-')) {

		aisle =
			upperAisle.substring(3);

	} else if (
		upperAisle.startsWith('FF')
	) {

		aisle =
			upperAisle
				.substring(2)
				.replace(/^-/, '');

	}


	const parts = [
		`FF-${aisle}`,
		side.toUpperCase(),
		bay
	].filter(Boolean);


	return parts.join('-');

};



/* ---------------------------------------------------------
   SHOW PRODUCT DETAILS
--------------------------------------------------------- */

const showProductDetail = async (product) => {

	/* Hide search UI */

	productSearchSection.hidden = true;
	productResults.hidden = true;
	productEmpty.hidden = true;


	productBackButton.href =
		'product.html';

	productBackButton.setAttribute(
		'aria-label',
		'Back to product search'
	);



	/* Product information */

	detailImage.src =
		product.imageUrl ||
		product.image?.url ||
		'';

	detailImage.alt =
		product.description ||
		'Product image';


	detailName.textContent =
		product.description ||
		'Unknown product';


	detailUpc.textContent =
		`UPC: ${product.upc || '—'}`;



	/* Total stock */

	detailOnHand.textContent =
		product.onHand ?? 0;



	/* -----------------------------------------------------
	   LOAD ALL LOCATIONS FOR THIS PRODUCT
	----------------------------------------------------- */

	let locations = [];


	try {

		locations =
			await apiRequest(
				`${API_BASE}/${encodeURIComponent(product.upc)}/locations`
			);

	} catch (error) {

		console.error(
			'Unable to load product locations:',
			error
		);

		locations = [];

	}



	/* Number of locations */

	detailLocCount.textContent =
		locations.length;



	/* Clear previous locations */

	locationModules.innerHTML = '';



	/* -----------------------------------------------------
	   CREATE LOCATION MODULES
	----------------------------------------------------- */

	locations.forEach((location) => {

		const locationModule =
			document.createElement('div');

		locationModule.className =
			'metric-card metric-card-location';



		const locationId =
			getLocationId(location);



		const shelf =
			location.shelf ||
			location.bay ||
			'-';



		locationModule.innerHTML = `
			<span class="metric-value-location">
				${locationId}
			</span>

			<span class="metric-sub">
				SHELF ${shelf}
			</span>
		`;



		locationModules.appendChild(
			locationModule
		);

	});



	/* -----------------------------------------------------
	   PRIMARY LOCATION
	----------------------------------------------------- */

	const primaryLocation =
		locations.find(
			location => location.isPrimary
		) || locations[0];



	if (primaryLocation) {

		bayLocText.textContent =
			getLocationId(
				primaryLocation
			);


		bayShelfNum.textContent =
			primaryLocation.shelf ||
			primaryLocation.bay ||
			'-';

	} else {

		bayLocText.textContent =
			'No location';

		bayShelfNum.textContent =
			'-';

	}



	/* Bay image */

	bayImage.src =
		product.imageUrl ||
		product.image?.url ||
		'';

	bayImage.alt =
		`${product.description || 'Product'} bay location`;



	/* Show detail page */

	productDetailView.hidden =
		false;



	/* Re-render Lucide icons */

	lucide.createIcons();

};



/* ---------------------------------------------------------
   SEARCH PRODUCT
--------------------------------------------------------- */

const searchProduct = async () => {

	const query =
		input.value.trim().toLowerCase();



	/* Clear old results */

	productResults.innerHTML = '';



	/* Empty search */

	if (!query) {

		productResults.hidden =
			true;

		productDetailView.hidden =
			true;

		productSearchSection.hidden =
			false;

		productEmpty.hidden =
			false;



		/* Change back button to return to tasks */

		productBackButton.href =
			'index.html';

		productBackButton.setAttribute(
			'aria-label',
			'Back to tasks'
		);


		productEmpty.textContent =
			'Enter a UPC or product name to search.';

		return;

	}



	/* -----------------------------------------------------
	   LOAD DATABASE
	----------------------------------------------------- */

	let items = [];


	try {

		items =
			await apiRequest(
				API_BASE
			);

	} catch (error) {

		console.error(
			'Unable to load inventory:',
			error
		);


		productEmpty.hidden =
			false;

		productResults.hidden =
			true;


		productEmpty.textContent =
			'Unable to load inventory.';

		return;

	}



	let matches = [];



	/* -----------------------------------------------------
	   UPC SEARCH
	----------------------------------------------------- */

	if (/^\d+$/.test(query)) {

		if (query.length < 6) {

			productEmpty.hidden =
				false;

			productResults.hidden =
				true;


			productEmpty.textContent =
				'Enter at least 6 digits for a UPC.';

			return;

		}



		matches =
			items.filter((item) =>

				String(
					item.upc ?? ''
				).startsWith(query)

			);

	}



	/* -----------------------------------------------------
	   PRODUCT NAME SEARCH
	----------------------------------------------------- */

	else {

		matches =
			items.filter((item) =>

				String(
					item.description ?? ''
				)
				.toLowerCase()
				.includes(query)

			);

	}



	/* -----------------------------------------------------
	   NO RESULTS
	----------------------------------------------------- */

	if (!matches.length) {

		productEmpty.hidden =
			false;

		productResults.hidden =
			true;


		productEmpty.textContent =
			'No products found.';

		return;

	}



	/* -----------------------------------------------------
	   DISPLAY RESULTS
	----------------------------------------------------- */

	productEmpty.hidden =
		true;

	productResults.hidden =
		false;



	matches.forEach((product) => {

		const result =
			document.createElement('button');


		result.type =
			'button';


		result.className =
			'product-result';



		const imageUrl =
			product.imageUrl ||
			product.image?.url ||
			'';



		const imageHtml =
			imageUrl

				? `
					<img
						src="${imageUrl}"
						alt="${product.description || 'Product image'}"
					>
				`

				: `
					<div class="product-result-placeholder">
						No image
					</div>
				`;



		result.innerHTML = `

			<div class="product-result-image">
				${imageHtml}
			</div>

			<div class="product-result-info">

				<div class="product-result-name">
					${product.description || 'Unknown product'}
				</div>

				<div class="product-result-upc">
					UPC: ${product.upc || '—'}
				</div>

			</div>

		`;



		result.addEventListener(
			'click',
			() => showProductDetail(product)
		);



		productResults.appendChild(
			result
		);

	});

};



/* ---------------------------------------------------------
   EVENTS
--------------------------------------------------------- */

input.addEventListener(
	'input',
	searchProduct
);


searchButton.addEventListener(
	'click',
	searchProduct
);


input.addEventListener(
	'keydown',
	(event) => {

		if (event.key === 'Enter') {

			searchProduct();

		}

	}
);
