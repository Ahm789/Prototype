lucide.createIcons();

const input = document.querySelector('#product-input');
const searchButton = document.querySelector('#product-search');

const productEmpty = document.querySelector('#product-empty');
const productResults = document.querySelector('#product-results');
const productSearchSection = document.querySelector('#product-search-section');
const productDetailView = document.querySelector('#product-detail-view');

const detailImage = document.querySelector('#detail-image');
const detailName = document.querySelector('#detail-name');
const detailUpc = document.querySelector('#detail-upc');
const detailOnHand = document.querySelector('#detail-onhand');
const detailLocationId = document.querySelector('#detail-location-id');
const detailShelfId = document.querySelector('#detail-shelf-id');
const bayLocText = document.querySelector('#bay-loc-text');
const bayShelfNum = document.querySelector('#bay-shelf-num');
const bayImage = document.querySelector('#bay-image');

/*
 * SHOW PRODUCT DETAIL
 *
 * Hides the search section/results/empty state
 * and fills in + reveals the detail view.
 */
const showProductDetail = (product) => {

	productSearchSection.hidden = true;
	productResults.hidden = true;
	productEmpty.hidden = true;

	detailImage.src = product.image?.url || '';
	detailImage.alt = product.description || 'Product image';

	detailName.textContent = product.description || 'Unknown product';
	detailUpc.textContent = `UPC: ${product.upc || '—'}`;

	detailOnHand.textContent = product.onHand ?? 0;

	const locationId = `${product.aisle || ''}-${product.aisleSide || ''}-${product.bay || ''}`;
	detailLocationId.textContent = locationId;
	detailShelfId.textContent = `SHELF ${product.bay || '-'}`;

	bayLocText.textContent = locationId;
	bayShelfNum.textContent = product.bay || '-';
	bayImage.src = product.image?.url || '';
	bayImage.alt = `${product.description || 'Product'} bay location`;

	productDetailView.hidden = false;
};

/*
 * SHOW PRODUCT SEARCH
 *
 * Reverses showProductDetail — wire this to the
 * back arrow in the titlebar so users can return.
 */
const showProductSearch = () => {

	productDetailView.hidden = true;
	productSearchSection.hidden = false;

	if (productResults.childElementCount) {
		productResults.hidden = false;
	} else {
		productEmpty.hidden = false;
	}
};
const searchProduct = async () => {

	const query = input.value.trim().toLowerCase();

	productResults.innerHTML = '';


	// Nothing entered
	if (!query) {

		productResults.hidden = true;
		productEmpty.hidden = false;

		productEmpty.textContent =
			'Enter a UPC or product name to search.';

		return;
	}


	const items = await window.inventoryDatabase.getItems();

	let matches = [];


	/*
	 * UPC SEARCH
	 *
	 * Once 6 or more numbers have been entered,
	 * search using those numbers as the beginning
	 * of the UPC.
	 */
	if (/^\d+$/.test(query)) {

		if (query.length < 6) {

			productResults.hidden = true;
			productEmpty.hidden = false;

			productEmpty.textContent =
				'Enter at least 6 digits to search by UPC.';

			return;
		}


		matches = items.filter((item) => {

			const upc = String(item.upc ?? '');

			return upc.startsWith(query);

		});

	}


	/*
	 * PRODUCT NAME SEARCH
	 */
	else {

		matches = items.filter((item) => {

			const description =
				String(item.description ?? '').toLowerCase();

			return description.includes(query);

		});

	}


	/*
	 * NO RESULTS
	 */
	if (!matches.length) {

		productResults.hidden = true;
		productEmpty.hidden = false;

		productEmpty.textContent =
			'No matching products found.';

		return;
	}


	/*
	 * SHOW RESULTS
	 */
	productEmpty.hidden = true;
	productResults.hidden = false;


	matches.forEach((product) => {

		const result = document.createElement('button');

		result.type = 'button';
		result.className = 'product-result';


		const imageHtml = product.image?.url

			? `
				<img
					src="${product.image.url}"
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

        result.addEventListener('click', () => {
            showProductDetail(product);
        });
		productResults.appendChild(result);

	});

};


input.addEventListener('input', searchProduct);


searchButton.addEventListener('click', searchProduct);


input.addEventListener('keydown', (event) => {

	if (event.key === 'Enter') {
		searchProduct();
	}

});
