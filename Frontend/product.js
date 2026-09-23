const productBackButton =
	document.querySelector('#product-back-button');

lucide.createIcons();

const isLocal =
	window.location.protocol === 'file:' ||
	window.location.hostname === 'localhost' ||
	window.location.hostname === '127.0.0.1';

const API_ORIGIN =
	isLocal
		? 'http://localhost:3000'
		: '';

const API_BASE =
	`${API_ORIGIN}/api/products`;

const TASK_CLOCK_API =
	`${API_ORIGIN}/api/task-clock`;

const input =
	document.querySelector('#product-input');

const cameraButton =
	document.querySelector('#product-camera');

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

const detailCaseSize =
	document.querySelector('#detail-case-size');

const detailWeight =
	document.querySelector('#detail-weight');

const detailUrlBarcode =
	document.querySelector('#detail-url-barcode');

const detailCaseBarcode =
	document.querySelector('#detail-case-barcode');

const detailItemNumber =
	document.querySelector('#detail-item-number');

const detailDepartment =
	document.querySelector('#detail-department');

const detailPrice =
	document.querySelector('#detail-price');

const detailMaxShelf =
	document.querySelector('#detail-max-shelf');

const detailHffs =
	document.querySelector('#detail-hffs');

const modularAisle =
	document.querySelector('#modular-aisle');

const modularSide =
	document.querySelector('#modular-side');

const modularMod =
	document.querySelector('#modular-mod');

const modularShelf =
	document.querySelector('#modular-shelf');

const modularVisual =
	document.querySelector('#modular-visual');

const salesYesterdayUnits =
	document.querySelector('#sales-yesterday-units');

const sales7Units =
	document.querySelector('#sales-7-units');

const sales28Units =
	document.querySelector('#sales-28-units');

const sales7Availability =
	document.querySelector('#sales-7-availability');

const sales28Availability =
	document.querySelector('#sales-28-availability');

const sales7Total =
	document.querySelector('#sales-7-total');

const sales28Total =
	document.querySelector('#sales-28-total');

const sales7Lost =
	document.querySelector('#sales-7-lost');

const sales28Lost =
	document.querySelector('#sales-28-lost');

const productSearch =
	document.querySelector('.product-search');


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


const getModularProducts =
	async (
		modularId
	) => {

		return apiRequest(
			`${API_BASE}/modular/${encodeURIComponent(modularId)}`
		);

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
   BARCODE FOUND
========================================================= */

const handleBarcodeDetected =
	async (
		barcode
	) => {

		/*
			Stop the shared camera immediately.
		*/

		stopBarcodeScanner();


		/*
			Normalise the scanned barcode.
		*/

		const cleanBarcode =
			String(barcode)
				.trim()
				.replace(/\D/g, '');


		console.log(
			'Scanned barcode:',
			barcode
		);

		console.log(
			'Clean barcode:',
			cleanBarcode
		);


		/*
			Put the barcode into the search box.
		*/

		input.value =
			cleanBarcode;


		try {

			/*
				Look up the exact UPC directly.
			*/

			const fullProduct =
				await apiRequest(
					`${API_BASE}/${encodeURIComponent(
						cleanBarcode
					)}`
				);


			/*
				Go straight to the product detail page.
			*/

			await showProductDetail(
				fullProduct
			);


		} catch (error) {

			console.error(
				'Unable to load scanned product:',
				error
			);


			/*
				No matching product.
			*/

			productSearchSection.hidden =
				false;

			productResults.hidden =
				true;

			productDetailView.hidden =
				true;

			productEmpty.hidden =
				false;

			productEmpty.textContent =
				`No product found for barcode ${cleanBarcode}.`;

			input.focus();

		}

	};


/* =========================================================
   CAMERA BUTTON
========================================================= */

if (
	cameraButton
) {

	cameraButton.addEventListener(
		'click',
		event => {

			event.preventDefault();

			startBarcodeScanner(
				handleBarcodeDetected
			);

		}
	);

}


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


const renderModularVisual =
	async (
		modularId
	) => {

		modularVisual.innerHTML = '';

		if (!modularId) {
			return;
		}

		try {

			const products =
				await getModularProducts(
					modularId
				);

			if (
				!Array.isArray(products) ||
				products.length === 0
			) {

				modularVisual.innerHTML = `
					<div class="modular-visual-empty">
						No products found on this modular.
					</div>
				`;

				return;

			}


			/* GROUP PRODUCTS BY SHELF */

			const shelves =
				new Map();

			products.forEach(
				product => {

					const shelf =
						String(
							product.shelf ?? ''
						).trim();

					if (!shelves.has(shelf)) {

						shelves.set(
							shelf,
							[]
						);

					}

					shelves
						.get(shelf)
						.push(product);

				}
			);


			/* SORT SHELVES */

			const sortedShelves =
				[...shelves.entries()]
					.sort(
						([shelfA], [shelfB]) => {

							const numberA =
								parseInt(
									shelfA.replace(
										/[^0-9]/g,
										''
									),
									10
								);

							const numberB =
								parseInt(
									shelfB.replace(
										/[^0-9]/g,
										''
									),
									10
								);

							if (
								Number.isNaN(
									numberA
								)
							) {

								return 1;

							}

							if (
								Number.isNaN(
									numberB
								)
							) {

								return -1;

							}

							return (
								numberA -
								numberB
							);

						}
					);


			/* CREATE EACH SHELF */

			sortedShelves.forEach(
				([
					shelf,
					shelfProducts
				]) => {

					const shelfRow =
						document.createElement(
							'div'
						);

					shelfRow.className =
						'modular-shelf';


					const productsContainer =
						document.createElement(
							'div'
						);

					productsContainer.className =
						'modular-shelf-products';


					shelfRow.appendChild(
						productsContainer
					);

					modularVisual.appendChild(
						shelfRow
					);


					/*
						Wait until the shelf has
						its real width.
					*/

					requestAnimationFrame(
						async () => {

							const shelfWidth =
								productsContainer.clientWidth;

							const shelfHeight =
								90;

							const gap =
								8;

							const validProducts =
								shelfProducts.filter(
									product =>
										product.image &&
										product.image.url
								);

							if (!validProducts.length) {
								return;
							}


							/*
								Load all product images first.
							*/

							const loadedProducts =
								await Promise.all(
									validProducts.map(
										product =>
											new Promise(
												resolve => {

													const image =
														new Image();

													image.onload =
														() => {

															if (
																image.naturalWidth &&
																image.naturalHeight
															) {

																resolve({
																	product,
																	width:
																		(
																			image.naturalWidth /
																			image.naturalHeight
																		) *
																		shelfHeight
																});

															} else {

																resolve(null);

															}

														};

													image.onerror =
														() =>
															resolve(null);

													image.src =
														product.image.url;

												}
											)
									)
								);


							const usableProducts =
								loadedProducts.filter(
									Boolean
								);

							if (!usableProducts.length) {
								return;
							}


							/*
								Divide the shelf between
								the different products.
							*/

							const productWidth =
								(
									shelfWidth -
									(
										(usableProducts.length - 1) *
										gap
									)
								) /
								usableProducts.length;


							/*
								Create facings for each product.
							*/

							usableProducts.forEach(
								({
									product,
									width
								}) => {

									const maxFacings =
										Math.max(
											1,
											Math.floor(
												(
													productWidth +
													gap
												) /
												(
													width +
													gap
												)
											)
										);


									for (
										let i = 0;
										i < maxFacings;
										i++
									) {

										const facing =
											document.createElement(
												'img'
											);

										facing.src =
											product.image.url;

										facing.alt =
											product.image.alt ||
											product.description ||
											'Product';

										facing.className =
											'modular-product-image';

										facing.style.height =
											`${shelfHeight}px`;

										facing.style.width =
											`${width}px`;

										productsContainer.appendChild(
											facing
										);

									}

								}
							);

						}
					);

				}
			);

		} catch (error) {

			console.error(
				'Failed to render modular visual:',
				error
			);

			modularVisual.innerHTML = `
				<div class="modular-visual-empty">
					Unable to load modular.
				</div>
			`;

		}

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

		input.value =
			'';


		/* HIDE SEARCH UI */

		productSearch.hidden =
			true;

		productSearchSection.hidden =
			true;

		productResults.hidden =
			true;

		productEmpty.hidden =
			true;


		/* SHOW PRODUCT DETAILS */

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
		   PRODUCT DETAILS
		===================================================== */

		detailCaseSize.textContent =
			product.caseSize !== undefined &&
			product.caseSize !== null &&
			product.caseSize !== ''
				? `${product.caseSize} units`
				: '-';


		detailWeight.textContent =
			product.weight ||
			'-';


		detailUrlBarcode.textContent =
			product.upc ||
			'-';


		detailCaseBarcode.textContent =
			product.caseBarcode ||
			'-';


		detailItemNumber.textContent =
			product.itemNumber ||
			'-';


		detailDepartment.textContent =
			product.department ||
			'-';


		detailPrice.textContent =
			product.price !== undefined &&
			product.price !== null
				? `£${Number(product.price).toFixed(2)}`
				: '-';


		detailMaxShelf.textContent =
			product.maxShelf !== undefined &&
			product.maxShelf !== null &&
			product.maxShelf !== ''
				? `${product.maxShelf} units`
				: '-';


		const hffssStatus =
			product.hffssStatus ||
			'-';

		detailHffs.textContent =
			hffssStatus;

		detailHffs.classList.remove(
			'hffss-compliant',
			'hffss-not-compliant'
		);

		if (
			hffssStatus === 'Compliant'
		) {

			detailHffs.classList.add(
				'hffss-compliant'
			);

		} else if (
			hffssStatus === 'Not Compliant'
		) {

			detailHffs.classList.add(
				'hffss-not-compliant'
			);

		}


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
					`SHELF ${location.shelf ?? '-'}`;


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
				primaryLocation.modularId ??
				'-';

			bayShelfNum.textContent =
				primaryLocation.shelf ??
				'-';


			/* =================================================
			   MODULAR DETAILS
			================================================= */

			modularAisle.textContent =
				String(
					primaryLocation.aisle ?? '-'
				)
					.replace(
						/^Aisle\s*/i,
						''
					);

			modularSide.textContent =
				`Side ${primaryLocation.aisleSide ?? '-'}`;

			modularMod.textContent =
				`Mod ${primaryLocation.bay ?? '-'}`;

			modularShelf.textContent =
				`Shelf ${primaryLocation.shelf ?? '-'}`;

			await renderModularVisual(
				primaryLocation.modularId
			);

		} else {

			bayLocText.textContent =
				'-';

			bayShelfNum.textContent =
				'-';

			modularAisle.textContent =
				'Aisle -';

			modularSide.textContent =
				'Side -';

			modularMod.textContent =
				'Mod -';

			modularShelf.textContent =
				'Shelf -';

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

		await loadSalesData(
			product.upc
		);

	};


/* =========================================================
   LOAD SALES DATA
========================================================= */

const loadSalesData = async (
	upc
) => {

	try {

		const sales =
			await apiRequest(
				`${API_BASE}/${encodeURIComponent(upc)}/sales`
			);


		/* =====================================================
		   YESTERDAY
		===================================================== */

		salesYesterdayUnits.textContent =
			sales.yesterday.unitsSold;


		/* =====================================================
		   7 DAYS
		===================================================== */

		sales7Units.textContent =
			sales.sevenDays.unitsSold;

		sales7Availability.textContent =
			`${Number(
				sales.sevenDays.availability
			).toFixed(2)}%`;

		sales7Total.textContent =
			`£${Number(
				sales.sevenDays.totalSales
			).toFixed(2)}`;

		sales7Lost.textContent =
			`£${Number(
				sales.sevenDays.lostSales
			).toFixed(2)}`;


		/* =====================================================
		   28 DAYS
		===================================================== */

		sales28Units.textContent =
			sales.twentyEightDays.unitsSold;

		sales28Availability.textContent =
			`${Number(
				sales.twentyEightDays.availability
			).toFixed(2)}%`;

		sales28Total.textContent =
			`£${Number(
				sales.twentyEightDays.totalSales
			).toFixed(2)}`;

		sales28Lost.textContent =
			`£${Number(
				sales.twentyEightDays.lostSales
			).toFixed(2)}`;


	} catch (error) {

		console.error(
			'Failed to load sales data:',
			error
		);

	}

};


/* =========================================================
   SEARCH PRODUCTS
========================================================= */

const searchProducts =
	async () => {

		const query =
			input.value.trim();

		const isNumeric =
			/^\d+$/.test(query);

		const minimumLength =
			isNumeric
				? 6
				: 3;

		if (
			query.length < minimumLength
		) {

			productResults.hidden =
				true;

			productDetailView.hidden =
				true;

			productSearchSection.hidden =
				false;

			productEmpty.hidden =
				false;

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
						{
							once: true
						}
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

		/*
			If a product detail is currently being shown,
			go back to the Product Info search screen
			instead of leaving the page.
		*/

		if (
			!productDetailView.hidden
		) {

			event.preventDefault();

			currentProduct =
				null;

			productDetailView.hidden =
				true;

			productResults.hidden =
				true;

			productSearchSection.hidden =
				false;

			productEmpty.hidden =
				false;

			productEmpty.textContent =
				'Enter a UPC or product name to search.';

			input.value =
				'';

			input.focus();

			return;

		}

		/*
			If we are already on the Product Info
			search screen, allow the normal href
			to index.html.
		*/

		// Normal navigation to index.html.

	}
);


/* =========================================================
   TAB SWITCHING
========================================================= */

const tabButtons =
	document.querySelectorAll(
		'.tab-btn'
	);

const tabPanels =
	document.querySelectorAll(
		'.tab-panel'
	);

tabButtons.forEach(
	button => {

		button.addEventListener(
			'click',
			() => {

				const selectedTab =
					button.dataset.tab;

				/* UPDATE ACTIVE BUTTON */

				tabButtons.forEach(
					tab => {

						tab.classList.toggle(
							'active',
							tab === button
						);

					}
				);


				/* SHOW SELECTED PANEL */

				tabPanels.forEach(
					panel => {

						panel.hidden =
							panel.dataset.panel !== selectedTab;

					}
				);

			}
		);

	}
);


const timestampDayButton =
	document.getElementById(
		'timestamp-day-button'
	);

const timestampDay =
	document.getElementById(
		'timestamp-day'
	);

const timestampOptions =
	document.getElementById(
		'timestamp-options'
	);

const timestampOptionsButtons =
	document.querySelectorAll(
		'.timestamp-option'
	);


if (
	timestampDayButton &&
	timestampOptions
) {

	timestampDayButton.addEventListener(
		'click',
		(event) => {

			event.stopPropagation();

			const isOpen =
				timestampDayButton.getAttribute(
					'aria-expanded'
				) === 'true';

			timestampDayButton.setAttribute(
				'aria-expanded',
				String(!isOpen)
			);

			timestampOptions.hidden =
				isOpen;

		}
	);


	timestampOptionsButtons.forEach(
		(option) => {

			option.addEventListener(
				'click',
				(event) => {

					event.stopPropagation();

					const selectedDay =
						option.dataset.day;

					timestampDay.textContent =
						selectedDay;

					timestampOptionsButtons.forEach(
						(button) => {

							const isSelected =
								button.dataset.day ===
								selectedDay;

							button.classList.toggle(
								'active',
								isSelected
							);

							button.setAttribute(
								'aria-selected',
								String(isSelected)
							);

						}
					);

					timestampDayButton.setAttribute(
						'aria-expanded',
						'false'
					);

					timestampOptions.hidden =
						true;

				}
			);

		}
	);


	document.addEventListener(
		'click',
		() => {

			timestampDayButton.setAttribute(
				'aria-expanded',
				'false'
			);

			timestampOptions.hidden =
				true;

		}
	);

}