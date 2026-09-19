const productBackButton =
	document.querySelector('#product-back-button');

lucide.createIcons();

const API_BASE =
	'http://localhost:3000/api/products';

const TASK_CLOCK_API =
	'http://localhost:3000/api/task-clock';

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

const stockTimeline =
	document.querySelector('#stock-timeline');


/* =========================================================
   API REQUEST
========================================================= */

const apiRequest = async (
	url,
	options = {}
) => {
	const response =
		await fetch(
			url,
			options
		);

	if (!response.ok) {
		throw new Error(
			`Request failed: ${response.status}`
		);
	}

	return response.json();
};


/* =========================================================
   SERVER STORE CLOCK
========================================================= */

const getStoreTime = async () => {
	try {
		const data =
			await apiRequest(
				TASK_CLOCK_API
			);

		const startTime =
			Number(
				data.startTime
			);

		if (!startTime) {
			return null;
		}

		const elapsedSeconds =
			Math.floor(
				(Date.now() - startTime) / 1000
			);

		let totalSeconds =
			9 * 60 * 60 +
			elapsedSeconds;

		totalSeconds =
			totalSeconds %
			(24 * 60 * 60);

		return totalSeconds;

	} catch (error) {
		console.error(
			'Unable to load store time:',
			error
		);

		return null;
	}
};


/* =========================================================
   STORE CLOCK STATE
========================================================= */

let currentStoreSeconds =
	null;

let currentTimelineHour =
	null;

let currentProduct =
	null;


/* =========================================================
   CURRENT STORE HOUR
========================================================= */

const getCurrentStoreHour = () => {
	if (
		currentStoreSeconds === null
	) {
		return 9;
	}

	return Math.floor(
		currentStoreSeconds / 3600
	);
};


/* =========================================================
   SEEDED RANDOM
========================================================= */

const seededRandom = (
	seed
) => {
	let value =
		seed;

	value =
		Math.sin(value) *
		10000;

	return value -
		Math.floor(value);
};


/* =========================================================
   TIMELINE TIME FORMAT
========================================================= */

const formatTimelineHour =
	(hour) => {
		const period =
			hour >= 12
				? 'PM'
				: 'AM';

		let displayHour =
			hour % 12;

		if (
			displayHour === 0
		) {
			displayHour = 12;
		}

		return `${displayHour} ${period}`;
	};


/* =========================================================
   STOCK STATUS
========================================================= */

const getStockStatus =
	(
		product,
		hour
	) => {
		const onHand =
			Number(
				product.onHand ?? 0
			);

		const upcString =
			String(
				product.upc ?? ''
			);

		let upcSeed =
			0;

		for (
			let i = 0;
			i < upcString.length;
			i++
		) {
			upcSeed +=
				upcString.charCodeAt(i) *
				(i + 1);
		}

		const random =
			seededRandom(
				upcSeed +
				(hour * 97)
			);

		if (
			hour === getCurrentStoreHour() &&
			onHand <= 0
		) {
			return 'oos';
		}

		if (
			hour === getCurrentStoreHour() &&
			onHand > 0 &&
			onHand <= 3
		) {
			return 'low';
		}

		if (
			random < 0.10
		) {
			return 'oos';
		}

		if (
			random < 0.28
		) {
			return 'low';
		}

		return 'available';
	};


/* =========================================================
   RENDER STOCK TIMELINE
========================================================= */

const renderStockTimeline =
	async (
		product
	) => {
		if (!stockTimeline) {
			return;
		}

		currentStoreSeconds =
			await getStoreTime();

		if (
			currentStoreSeconds === null
		) {
			return;
		}

		const currentHour =
			Math.floor(
				currentStoreSeconds / 3600
			);

		const startHour =
			6;

		const endHour =
			Math.min(
				currentHour,
				22
			);

		stockTimeline.replaceChildren();

		if (
			endHour < startHour
		) {
			currentTimelineHour =
				currentHour;

			return;
		}

		for (
			let hour = startHour;
			hour <= endHour;
			hour++
		) {
			const point =
				document.createElement(
					'div'
				);

			point.className =
				'timeline-point';

			const circle =
				document.createElement(
					'div'
				);

			const status =
				getStockStatus(
					product,
					hour
				);

			if (
				status === 'available'
			) {
				circle.className =
					'timeline-circle timeline-green';

			} else if (
				status === 'low'
			) {
				circle.className =
					'timeline-circle timeline-yellow';

				const label =
					document.createElement(
						'span'
					);

				label.textContent =
					'LOW';

				circle.appendChild(
					label
				);

			} else {
				circle.className =
					'timeline-circle timeline-red';

				const label =
					document.createElement(
						'span'
					);

				label.textContent =
					'OOS';

				circle.appendChild(
					label
				);
			}

			const time =
				document.createElement(
					'span'
				);

			time.className =
				'timeline-time';

			time.textContent =
				formatTimelineHour(
					hour
				);

			point.appendChild(
				circle
			);

			point.appendChild(
				time
			);

			stockTimeline.appendChild(
				point
			);

			if (
				hour < endHour
			) {
				const line =
					document.createElement(
						'div'
					);

				line.className =
					'timeline-line';

				stockTimeline.appendChild(
					line
				);
			}
		}

		currentTimelineHour =
			currentHour;
	};


/* =========================================================
   CHECK SERVER CLOCK
========================================================= */

const syncTimelineClock =
	async () => {
		if (
			!currentProduct
		) {
			return;
		}

		const newStoreSeconds =
			await getStoreTime();

		if (
			newStoreSeconds === null
		) {
			return;
		}

		const newHour =
			Math.floor(
				newStoreSeconds / 3600
			);

		currentStoreSeconds =
			newStoreSeconds;

		if (
			currentTimelineHour === null ||
			newHour !== currentTimelineHour
		) {
			await renderStockTimeline(
				currentProduct
			);
		}
	};

setInterval(
	syncTimelineClock,
	1000
);


/* =========================================================
   PRODUCT LOCATION ID
========================================================= */

const getLocationId =
	(location) => {
		return location.id ??
			location.modularId ??
			location.locationId ??
			'';
	};


/* =========================================================
   SHOW PRODUCT DETAIL
========================================================= */

const showProductDetail =
	async (
		product
	) => {
		currentProduct =
			product;

		productEmpty.hidden =
			true;

		productResults.hidden =
			true;

		productSearchSection.hidden =
			true;

		productDetailView.hidden =
			false;


		/* =====================================================
		   PRODUCT IMAGE
		===================================================== */

		const productImage =
			product.image?.url ||
			product.imageUrl ||
			product.image_url ||
			'';

		const productImageAlt =
			product.image?.alt ||
			product.imageAlt ||
			product.image_alt ||
			product.description ||
			'Product image';

		detailImage.src =
			productImage;

		detailImage.alt =
			productImageAlt;


		/* =====================================================
		   PRODUCT NAME
		===================================================== */

		detailName.textContent =
			product.description ||
			'Product Name';


		/* =====================================================
		   UPC
		===================================================== */

		detailUpc.textContent =
			`UPC: ${product.upc || '-'}`;


		/* =====================================================
		   ON HAND
		===================================================== */

		detailOnHand.textContent =
			product.onHand ??
			0;


		/* =====================================================
		   LOCATIONS
		===================================================== */

		const locations =
			Array.isArray(
				product.locations
			)
				? product.locations
				: [];

		detailLocCount.textContent =
			locations.length;

		locationModules.replaceChildren();

		locations.forEach(
			(
				location,
				index
			) => {
				const card =
					document.createElement(
						'div'
					);

				card.className =
					'metric-card';

				const locationValue =
					document.createElement(
						'span'
					);

				locationValue.className =
					'metric-value-location';

				locationValue.textContent =
					location.modularId ||
					'-';

				const locationSub =
					document.createElement(
						'span'
					);

				locationSub.className =
					'metric-sub';

				locationSub.textContent =
					`AISLE ${location.aisle ?? '-'} • ` +
					`BAY ${location.bay ?? '-'}`;

				card.appendChild(
					locationValue
				);

				card.appendChild(
					locationSub
				);

				locationModules.appendChild(
					card
				);
			}
		);


		/* =====================================================
		   PRIMARY LOCATION DETAILS
		===================================================== */

		const primaryLocation =
			locations.find(
				location =>
					location.isPrimary
			) ||
			locations[0];

		if (
			primaryLocation
		) {
			bayLocText.textContent =
				`Aisle ${primaryLocation.aisle ?? '-'} ` +
				`${primaryLocation.aisleSide ?? ''} ` +
				`Bay ${primaryLocation.bay ?? '-'}`;

			bayShelfNum.textContent =
				primaryLocation.shelf ??
				'-';

		} else {
			bayLocText.textContent =
				'-';

			bayShelfNum.textContent =
				'-';
		}


		/* =====================================================
		   BAY IMAGE
		===================================================== */

		bayImage.src =
			productImage;

		bayImage.alt =
			productImageAlt;


		currentTimelineHour =
			null;

		await renderStockTimeline(
			product
		);
	};


/* =========================================================
   SEARCH PRODUCTS
========================================================= */

const searchProducts =
	async () => {
		const query =
			input.value.trim();

		if (!query) {
			productResults.hidden =
				true;

			productDetailView.hidden =
				true;

			productSearchSection.hidden =
				false;

			productEmpty.hidden =
				false;

			productEmpty.textContent =
				'Enter a UPC or product name to search.';

			return;
		}

		try {
			const results =
				await apiRequest(
					`${API_BASE}/search?q=` +
					encodeURIComponent(
						query
					)
				);

			productResults.replaceChildren();

			if (
				!Array.isArray(results) ||
				results.length === 0
			) {
				productResults.hidden =
					false;

				productDetailView.hidden =
					true;

				productEmpty.hidden =
					false;

				productEmpty.textContent =
					'No products found.';

				return;
			}

			productEmpty.hidden =
				true;

			productResults.hidden =
				false;

			productDetailView.hidden =
				true;


			/* =================================================
			   SEARCH RESULTS
			================================================= */

			results.forEach(
				product => {

					const result =
						document.createElement(
							'button'
						);

					result.type =
						'button';

					result.className =
						'product-result';


					/* IMAGE */

					const image =
						document.createElement(
							'img'
						);

					const productImage =
						product.image?.url ||
						product.imageUrl ||
						product.image_url ||
						'';

					const productImageAlt =
						product.image?.alt ||
						product.imageAlt ||
						product.image_alt ||
						product.description ||
						'Product image';

					image.src =
						productImage;

					image.alt =
						productImageAlt;

					image.addEventListener(
						'error',
						() => {
							image.removeAttribute(
								'src'
							);
						},
						{ once: true }
					);


					/* DETAILS */

					const details =
						document.createElement(
							'div'
						);

					details.className =
						'product-result-details';


					const name =
						document.createElement(
							'strong'
						);

					name.textContent =
						product.description ||
						'Product';


					const upc =
						document.createElement(
							'span'
						);

					upc.textContent =
						`UPC: ${product.upc || '-'}`;


					details.appendChild(
						name
					);

					details.appendChild(
						upc
					);


					result.appendChild(
						image
					);

					result.appendChild(
						details
					);


					/* LOAD FULL PRODUCT */

					result.addEventListener(
						'click',
						async () => {
							try {
								const fullProduct =
									await apiRequest(
										`${API_BASE}/${encodeURIComponent(
											product.upc
										)}`
									);

								await showProductDetail(
									fullProduct
								);

							} catch (error) {
								console.error(
									'Unable to load product:',
									error
								);
							}
						}
					);


					productResults.appendChild(
						result
					);
				}
			);

		} catch (error) {
			console.error(
				'Product search failed:',
				error
			);

			productResults.hidden =
				true;

			productDetailView.hidden =
				true;

			productEmpty.hidden =
				false;

			productEmpty.textContent =
				'Unable to search products.';
		}
	};


/* =========================================================
   SEARCH EVENTS
========================================================= */

searchButton.addEventListener(
	'click',
	searchProducts
);

input.addEventListener(
	'input',
	searchProducts
);
input.addEventListener(
	'keydown',
	event => {
		if (
			event.key === 'Enter'
		) {
			searchProducts();
		}
	}
);


/* =========================================================
   BACK BUTTON
========================================================= */

productBackButton.addEventListener(
	'click',
	event => {
		/* Allow normal navigation back to index.html. */
	}
);


/* =========================================================
   TAB SWITCHING
========================================================= */

const tabButtons =
	document.querySelectorAll(
		'.tab-btn'
	);

tabButtons.forEach(
	button => {
		button.addEventListener(
			'click',
			() => {

				tabButtons.forEach(
					tab => {
						tab.classList.remove(
							'active'
						);
					}
				);

				button.classList.add(
					'active'
				);
			}
		);
	}
);
const timestampDayButton = document.getElementById('timestamp-day-button');
const timestampDay = document.getElementById('timestamp-day');
const timestampOptions = document.getElementById('timestamp-options');
const timestampOptionsButtons = document.querySelectorAll('.timestamp-option');

if (timestampDayButton && timestampOptions) {

	timestampDayButton.addEventListener('click', (event) => {

		event.stopPropagation();

		const isOpen =
			timestampDayButton.getAttribute('aria-expanded') === 'true';

		timestampDayButton.setAttribute(
			'aria-expanded',
			String(!isOpen)
		);

		timestampOptions.hidden = isOpen;

	});


	timestampOptionsButtons.forEach((option) => {

		option.addEventListener('click', (event) => {

			event.stopPropagation();

			const selectedDay = option.dataset.day;

			timestampDay.textContent = selectedDay;

			timestampOptionsButtons.forEach((button) => {

				const isSelected =
					button.dataset.day === selectedDay;

				button.classList.toggle(
					'active',
					isSelected
				);

				button.setAttribute(
					'aria-selected',
					String(isSelected)
				);

			});

			timestampDayButton.setAttribute(
				'aria-expanded',
				'false'
			);

			timestampOptions.hidden = true;

		});

	});


	document.addEventListener('click', () => {

		timestampDayButton.setAttribute(
			'aria-expanded',
			'false'
		);

		timestampOptions.hidden = true;

	});

}