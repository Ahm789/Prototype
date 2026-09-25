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

const MODULAR_ACTIVITY_API =
	`${API_BASE}/modular-activity`;

const MODULAR_ACTIVITY_DATES_API =
	`${MODULAR_ACTIVITY_API}/dates`;

const MODULAR_BAY_API =
	`${API_BASE}/modular-bay`;


/* =========================================================
   INITIALISE LUCIDE ICONS
========================================================= */

lucide.createIcons();


/* =========================================================
   ELEMENTS
========================================================= */

const selectionSlider =
	document.querySelector('.selection-slider');

const filterPanel =
	document.querySelector('.filter-panel');

const scannerApp =
	document.querySelector('.scanner-app');

const filterButton =
	document.querySelector('.filter-button');

const closeFilters =
	document.querySelector('.close-filters');

const resetFilters =
	document.querySelector('.reset-filters');

const applyFilters =
	document.querySelector('.apply-filters');

const filterLabel =
	filterButton.querySelector('span');

const filterSelects =
	document.querySelectorAll(
		'.filter-panel select'
	);

const taskCards =
	document.querySelector('#task-cards');

const taskEmpty =
	document.querySelector('#task-empty');

const timerValue =
	document.querySelector('#task-timer-value');

const taskClock =
	document.querySelector('#task-clock');

const appMenuButton =
	document.querySelector('.app-menu-button');


const modularActivityCards =
	document.querySelector(
		'#modular-activity-cards'
	);

const modularSearch =
	document.querySelector(
		'#modular-search-upc'
	);

const modularSearchCamera =
	document.querySelector(
		'#modular-search-camera'
	);


/* =========================================================
   DEPARTMENT NAMES
========================================================= */

const departmentNames = {

	'71':
		'Meat, Fish & World Food',

	'72':
		'Vegetables, Chips & Yorkshire Puddings',

	'73':
		'Ice Cream, Desserts, Cakes & Fruit',

	'91':
		'Free From, Pizza, Ready Meals & Party Food'

};


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
			{
				...options,

				headers: {
					'Content-Type':
						'application/json',

					...(options.headers || {})
				}
			}
		);


	if (!response.ok) {

		let message =
			`Request failed with status ${response.status}`;


		try {

			const data =
				await response.json();

			if (data.error) {

				message =
					data.error;

			}

		} catch (error) {

			// Ignore invalid JSON

		}


		throw new Error(message);

	}


	return await response.json();

};


/* =========================================================
   GET MODULAR BAY PRODUCTS
========================================================= */

const getModularBayProducts =
	async (
		planogramNumber
	) => {

		return await apiRequest(
			`${MODULAR_BAY_API}/${encodeURIComponent(
				planogramNumber
			)}`
		);

	};


/* =========================================================
   CREATE MODULAR BAY SNAPSHOTS
========================================================= */

const createModularBaySnapshot =
	async (
		planogramNumber
	) => {

		const products =
			await getModularBayProducts(
				planogramNumber
			);

		if (
			!Array.isArray(products) ||
			products.length === 0
		) {
			return null;
		}


		/* =====================================================
		   SHARED BAY DIMENSIONS
		===================================================== */

		const shelfHeight =
			90;

		const gap =
			8;

		const bayWidth =
			800;

		const minimumBayHeight =
			300;

		const cropPadding =
			0;


		/* =====================================================
		   CROP PRODUCT IMAGE TO VISIBLE CONTENT
		===================================================== */

		const cropProductImage =
			imageUrl =>
				new Promise(
					resolve => {

						const image =
							new Image();

						image.crossOrigin =
							'anonymous';

						image.onload =
							() => {

								try {

									const naturalWidth =
										image.naturalWidth;

									const naturalHeight =
										image.naturalHeight;


									if (
										!naturalWidth ||
										!naturalHeight
									) {

										resolve(
											null
										);

										return;

									}


									/* =================================
									   CREATE SOURCE CANVAS
									================================= */

									const sourceCanvas =
										document.createElement(
											'canvas'
										);

									sourceCanvas.width =
										naturalWidth;

									sourceCanvas.height =
										naturalHeight;


									const sourceContext =
										sourceCanvas.getContext(
											'2d',
											{
												willReadFrequently:
													true
											}
										);


									sourceContext.drawImage(
										image,
										0,
										0,
										naturalWidth,
										naturalHeight
									);


									const imageData =
										sourceContext.getImageData(
											0,
											0,
											naturalWidth,
											naturalHeight
										);


									const pixels =
										imageData.data;


									/* =================================
									   FIND NON-WHITE CONTENT
									================================= */

									let left =
										naturalWidth;

									let right =
										-1;

									let top =
										naturalHeight;

									let bottom =
										-1;


									for (
										let y = 0;
										y < naturalHeight;
										y++
									) {

										for (
											let x = 0;
											x < naturalWidth;
											x++
										) {

											const index =
												(
													(
														y *
														naturalWidth
													) +
													x
												) *
												4;


											const red =
												pixels[
													index
												];

											const green =
												pixels[
													index + 1
												];

											const blue =
												pixels[
													index + 2
												];

											const alpha =
												pixels[
													index + 3
												];


											/*
											   Treat transparent
											   and near-white pixels
											   as background.
											*/

											const isTransparent =
												alpha <
												20;

											const isWhite =
												red >= 245 &&
												green >= 245 &&
												blue >= 245;


											if (
												!isTransparent &&
												!isWhite
											) {

												left =
													Math.min(
														left,
														x
													);

												right =
													Math.max(
														right,
														x
													);

												top =
													Math.min(
														top,
														y
													);

												bottom =
													Math.max(
														bottom,
														y
													);

											}

										}

									}


									/* =================================
									   FALLBACK TO FULL IMAGE
									================================= */

									if (
										right < left ||
										bottom < top
									) {

										resolve({
											url:
												imageUrl,

											width:
												naturalWidth,

											height:
												naturalHeight
										});

										return;

									}


									/* =================================
									   APPLY CROP PADDING
									================================= */

									left =
										Math.max(
											0,
											left -
											cropPadding
										);

									top =
										Math.max(
											0,
											top -
											cropPadding
										);

									right =
										Math.min(
											naturalWidth - 1,
											right +
											cropPadding
										);

									bottom =
										Math.min(
											naturalHeight - 1,
											bottom +
											cropPadding
										);


									const croppedWidth =
										right -
										left +
										1;

									const croppedHeight =
										bottom -
										top +
										1;


									/* =================================
									   CREATE CROPPED CANVAS
									================================= */

									const croppedCanvas =
										document.createElement(
											'canvas'
										);

									croppedCanvas.width =
										croppedWidth;

									croppedCanvas.height =
										croppedHeight;


									const croppedContext =
										croppedCanvas.getContext(
											'2d'
										);


									croppedContext.drawImage(
										image,

										left,
										top,
										croppedWidth,
										croppedHeight,

										0,
										0,
										croppedWidth,
										croppedHeight
									);


									resolve({
										url:
											croppedCanvas.toDataURL(
												'image/png'
											),

										width:
											croppedWidth,

										height:
											croppedHeight
									});

								}
								catch (
									error
								) {

									console.error(
										'Failed to crop product image:',
										error
									);

									resolve(
										null
									);

								}

							};


						image.onerror =
							() =>
								resolve(
									null
								);


						image.src =
							imageUrl;

					}
				);


		/* =====================================================
		   GROUP PRODUCTS BY BAY
		===================================================== */

		const bays =
			new Map();

		products.forEach(
			product => {

				const bayNumber =
					String(
						product.bayNumber ?? ''
					).trim();

				if (!bays.has(bayNumber)) {

					bays.set(
						bayNumber,
						[]
					);

				}

				bays
					.get(bayNumber)
					.push(product);

			}
		);


		/* =====================================================
		   CALCULATE SHARED BAY HEIGHT
		===================================================== */

		const maxShelfCount =
			Math.max(
				...[
					...bays.values()
				].map(
					bayProducts =>
						new Set(
							bayProducts.map(
								product =>
									String(
										product.shelf ?? ''
									).trim()
							)
						).size
				)
			);


		const calculatedBayHeight =
			(
				maxShelfCount *
				shelfHeight
			) +
			(
				Math.max(
					0,
					maxShelfCount - 1
				) *
				gap
			);


		const bayHeight =
			Math.max(
				minimumBayHeight,
				calculatedBayHeight
			);


		/* =====================================================
		   GENERATE ONE SNAPSHOT PER BAY
		===================================================== */

		const snapshots = [];


		/*
		   Store the cropped canvas information first.

		   This lets us find the widest snapshot before
		   creating the final images.

		   The widest snapshot naturally produces the
		   smallest displayed height when all images use
		   width: 100%.
		*/

		const pendingSnapshots = [];


		for (
			const [
				bayNumber,
				bayProducts
			]
			of bays
		) {

			/* =================================================
			   CREATE TEMPORARY MODULAR VISUAL
			================================================= */

			const modularVisual =
				document.createElement(
					'div'
				);

			modularVisual.className =
				'modular-visual';

			modularVisual.style.width =
				`${bayWidth}px`;

			modularVisual.style.height =
				`${bayHeight}px`;

			modularVisual.style.minHeight =
				`${bayHeight}px`;

			modularVisual.style.maxWidth =
				'none';

			modularVisual.style.boxSizing =
				'border-box';

			modularVisual.style.background =
				'#ffffff';

			modularVisual.style.position =
				'absolute';

			modularVisual.style.left =
				'-99999px';

			modularVisual.style.top =
				'0';

			modularVisual.style.visibility =
				'visible';

			modularVisual.style.overflow =
				'hidden';

			document.body.appendChild(
				modularVisual
			);


			/* =================================================
			   GROUP PRODUCTS BY SHELF
			================================================= */

			const shelves =
				new Map();

			bayProducts.forEach(
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


			/* =================================================
			   SORT SHELVES
			===================================================== */

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


			/* =================================================
			   CREATE SHELF ROWS
			===================================================== */

			sortedShelves.forEach(
				([
					shelf,
					shelfProducts
				]) => {

					shelfProducts.sort(
						(a, b) =>
							Number(
								a.shelfOrder ?? 0
							) -
							Number(
								b.shelfOrder ?? 0
							)
					);


					const shelfRow =
						document.createElement(
							'div'
						);

					shelfRow.className =
						'modular-shelf';

					shelfRow.style.width =
						`${bayWidth}px`;

					shelfRow.style.height =
						`${shelfHeight}px`;

					shelfRow.style.minHeight =
						`${shelfHeight}px`;

					shelfRow.style.flex =
						`0 0 ${shelfHeight}px`;

					shelfRow.style.boxSizing =
						'border-box';

					shelfRow.style.display =
						'flex';

					shelfRow.style.alignItems =
						'center';

					shelfRow.style.justifyContent =
						'center';

					shelfRow.style.overflow =
						'hidden';


					const productsContainer =
						document.createElement(
							'div'
						);

					productsContainer.className =
						'modular-shelf-products';

					productsContainer.style.display =
						'flex';

					productsContainer.style.alignItems =
						'center';

					productsContainer.style.justifyContent =
						'center';

					productsContainer.style.width =
						'100%';

					productsContainer.style.height =
						`${shelfHeight}px`;

					productsContainer.style.minHeight =
						`${shelfHeight}px`;

					productsContainer.style.gap =
						`${gap}px`;

					productsContainer.style.boxSizing =
						'border-box';

					productsContainer.style.overflow =
						'hidden';


					shelfRow.appendChild(
						productsContainer
					);

					modularVisual.appendChild(
						shelfRow
					);

				}
			);


			/* =================================================
			   WAIT FOR SHELF LAYOUT
			===================================================== */

			await new Promise(
				resolve =>
					requestAnimationFrame(
						resolve
					)
			);


			/* =================================================
			   RENDER EACH SHELF
			===================================================== */

			const shelfRows =
				[
					...modularVisual.querySelectorAll(
						'.modular-shelf'
					)
				];


			for (
				let shelfIndex = 0;
				shelfIndex < shelfRows.length;
				shelfIndex++
			) {

				const shelfRow =
					shelfRows[
						shelfIndex
					];

				const productsContainer =
					shelfRow.querySelector(
						'.modular-shelf-products'
					);


				const [
					,
					shelfProducts
				] =
					sortedShelves[
						shelfIndex
					];


				/* =============================================
				   LOAD + CROP PRODUCT IMAGES
				============================================= */

				const loadedProducts =
					await Promise.all(
						shelfProducts
							.filter(
								product =>
									product.image &&
									product.image.url
							)
							.map(
								async product => {

									const croppedImage =
										await cropProductImage(
											product.image.url
										);


									if (
										!croppedImage
									) {
										return null;
									}


									/*
									   Scale the cropped
									   content to the full
									   shelf height while
									   preserving its
									   aspect ratio.
									*/

									const width =
										(
											croppedImage.width /
											croppedImage.height
										) *
										shelfHeight;


									return {
										product,

										url:
											croppedImage.url,

										width
									};

								}
							)
					);


				const usableProducts =
					loadedProducts.filter(
						Boolean
					);


				if (
					!usableProducts.length
				) {
					continue;
				}


				/* =============================================
				   CALCULATE NATURAL SHELF WIDTH
				============================================= */

				const totalNaturalProductWidth =
					usableProducts.reduce(
						(total, { width, product }) => {

							const facings =
								Math.max(
									1,
									Number(
										product.facings ?? 1
									)
								);

							return (
								total +
								(
									width *
									facings
								)
							);

						},
						0
					);


				const totalProductGaps =
					usableProducts.reduce(
						(total, { product }) => {

							const facings =
								Math.max(
									1,
									Number(
										product.facings ?? 1
									)
								);

							return (
								total +
								Math.max(
									0,
									facings - 1
								)
							);

						},
						0
					) *
					gap;


				const groupGaps =
					Math.max(
						0,
						usableProducts.length - 1
					) *
					gap;


				const naturalShelfWidth =
					totalNaturalProductWidth +
					totalProductGaps +
					groupGaps;


				/* =============================================
				   DETERMINE DISPLAY SCALE
				============================================= */

				const shelfScale =
					naturalShelfWidth > bayWidth
						? bayWidth / naturalShelfWidth
						: 1;


				productsContainer.style.width =
					`${naturalShelfWidth}px`;

				productsContainer.style.flex =
					'0 0 auto';

				productsContainer.style.justifyContent =
					'flex-start';


				if (
					shelfScale < 1
				) {

					productsContainer.style.transformOrigin =
						'center center';

					productsContainer.style.transform =
						`scaleX(${shelfScale})`;

				}


				/* =============================================
				   CREATE PRODUCT GROUPS + FACINGS
				============================================= */

				usableProducts.forEach(
					({
						product,
						url,
						width
					}) => {

						const productGroup =
							document.createElement(
								'div'
							);

						productGroup.className =
							'modular-product-group';

						productGroup.style.display =
							'flex';

						productGroup.style.flexDirection =
							'row';

						productGroup.style.alignItems =
							'center';

						productGroup.style.gap =
							`${gap}px`;

						productGroup.style.flex =
							'0 0 auto';


						const facings =
							Math.max(
								1,
								Number(
									product.facings ?? 1
								)
							);


						/* =====================================
						   CREATE ONE IMAGE PER FACING
						===================================== */

						for (
							let i = 0;
							i < facings;
							i++
						) {

							const facing =
								document.createElement(
									'img'
								);

							facing.src =
								url;

							facing.alt =
								product.image.alt ||
								product.description ||
								'Product';

							facing.className =
								'modular-product-image';


							/* =================================
							   CROPPED CONTENT FILLS HEIGHT
							================================= */

							facing.style.display =
								'block';

							facing.style.height =
								`${shelfHeight}px`;

							facing.style.width =
								`${width}px`;

							facing.style.minWidth =
								`${width}px`;

							facing.style.maxWidth =
								`${width}px`;

							facing.style.flex =
								`0 0 ${width}px`;

							facing.style.objectFit =
								'fill';

							facing.style.objectPosition =
								'center center';


							productGroup.appendChild(
								facing
							);

						}


						productsContainer.appendChild(
							productGroup
						);

					}
				);

			}


			/* =================================================
			   WAIT FOR ALL IMAGES
			===================================================== */

			const images =
				[
					...modularVisual.querySelectorAll(
						'img'
					)
				];


			await Promise.all(
				images.map(
					image => {

						if (
							image.complete
						) {
							return Promise.resolve();
						}

						return new Promise(
							resolve => {

								image.onload =
									resolve;

								image.onerror =
									resolve;

							}
						);

					}
				)
			);


			/* =================================================
			   FINAL LAYOUT PASS
			===================================================== */

			await new Promise(
				resolve =>
					requestAnimationFrame(
						() =>
							requestAnimationFrame(
								resolve
							)
					)
			);


			/* =================================================
			   FIND ACTUAL HORIZONTAL CONTENT BOUNDS
			===================================================== */

			const renderedImages =
				[
					...modularVisual.querySelectorAll(
						'img'
					)
				];


			let contentLeft =
				bayWidth;

			let contentRight =
				0;


			renderedImages.forEach(
				image => {

					const rect =
						image.getBoundingClientRect();

					const visualRect =
						modularVisual.getBoundingClientRect();

					const left =
						rect.left -
						visualRect.left;

					const right =
						rect.right -
						visualRect.left;

					contentLeft =
						Math.min(
							contentLeft,
							left
						);

					contentRight =
						Math.max(
							contentRight,
							right
						);

				}
			);


			if (
				contentRight <= contentLeft
			) {

				contentLeft =
					0;

				contentRight =
					bayWidth;

			}


			contentLeft =
				Math.max(
					0,
					Math.floor(
						contentLeft -
						cropPadding
					)
				);

			contentRight =
				Math.min(
					bayWidth,
					Math.ceil(
						contentRight +
						cropPadding
					)
				);


			const croppedWidth =
				Math.max(
					1,
					contentRight -
					contentLeft
				);


			/* =================================================
			   CREATE FULL CANVAS
			===================================================== */

			const canvas =
				await html2canvas(
					modularVisual,
					{
						backgroundColor:
							'#ffffff',

						scale:
							2,

						useCORS:
							true,

						width:
							bayWidth,

						height:
							bayHeight
					}
				);


			/* =================================================
			   CROP HORIZONTAL WHITE SPACE
			===================================================== */

			const cropCanvas =
				document.createElement(
					'canvas'
				);

			cropCanvas.width =
				croppedWidth * 2;

			cropCanvas.height =
				bayHeight * 2;


			const cropContext =
				cropCanvas.getContext(
					'2d'
				);


			cropContext.drawImage(
				canvas,
				contentLeft * 2,
				0,
				croppedWidth * 2,
				bayHeight * 2,
				0,
				0,
				croppedWidth * 2,
				bayHeight * 2
			);


			/*
			   Store the cropped canvas rather than
			   immediately creating the final snapshot.

			   We need to know the widest bay first so
			   every snapshot can use the same aspect ratio.
			*/

			pendingSnapshots.push({
				bayNumber,
				cropCanvas,
				croppedWidth
			});


			/* =================================================
			   REMOVE TEMPORARY VISUAL
			===================================================== */

			modularVisual.remove();

		}


		/* =====================================================
		   FIND WIDEST SNAPSHOT
		===================================================== */

		const widestSnapshotWidth =
			Math.max(
				...pendingSnapshots.map(
					snapshot =>
						snapshot.croppedWidth
				)
			);


		/* =====================================================
		   NORMALISE SNAPSHOT WIDTHS
		===================================================== */

		pendingSnapshots.forEach(
			({
				bayNumber,
				cropCanvas,
				croppedWidth
			}) => {

				/*
				   Every snapshot keeps the same height.

				   The widest snapshot therefore determines
				   the smallest displayed height.

				   Narrower snapshots receive white space
				   on the left and right so they share the
				   exact same aspect ratio.
				*/

				const normalisedCanvas =
					document.createElement(
						'canvas'
					);

				normalisedCanvas.width =
					widestSnapshotWidth * 2;

				normalisedCanvas.height =
					bayHeight * 2;


				const normalisedContext =
					normalisedCanvas.getContext(
						'2d'
					);


				/* =============================================
				   WHITE BACKGROUND
				============================================= */

				normalisedContext.fillStyle =
					'#ffffff';

				normalisedContext.fillRect(
					0,
					0,
					normalisedCanvas.width,
					normalisedCanvas.height
				);


				/* =============================================
				   CENTRE ORIGINAL SNAPSHOT
				============================================= */

				const horizontalOffset =
					(
						widestSnapshotWidth -
						croppedWidth
					) *
					2 /
					2;


				normalisedContext.drawImage(
					cropCanvas,
					horizontalOffset,
					0
				);


				const snapshot =
					normalisedCanvas.toDataURL(
						'image/png'
					);


				snapshots.push({
					bayNumber,
					snapshot
				});

			}
		);


		return snapshots;

	};


/* =========================================================
   GET PRODUCTS FROM POSTGRESQL
========================================================= */

const getItems = async () => {

	return await apiRequest(
		API_BASE
	);

};


/* =========================================================
   RENDER RANDOM TASKS
========================================================= */

const renderRandomTasks = async () => {

	let items = [];


	try {

		items =
			await getItems();

	} catch (error) {

		console.error(
			'Unable to load inventory:',
			error
		);


		taskCards.replaceChildren();

		taskEmpty.hidden =
			false;

		taskEmpty.textContent =
			'Unable to load inventory.';

		return;

	}


	/* -----------------------------------------------------
	   SELECT RANDOM PRODUCTS
	----------------------------------------------------- */

	const selectedItems =
		[...items]
			.sort(
				() =>
					Math.random() - 0.5
			)
			.slice(
				0,
				Math.min(
					3,
					items.length
				)
			);


	/* Clear existing tasks */

	taskCards.replaceChildren();


	taskEmpty.hidden =
		selectedItems.length > 0;


	/* -----------------------------------------------------
	   CREATE TASK CARDS
	----------------------------------------------------- */

	selectedItems.forEach(
		(item) => {

			const card =
				document.createElement(
					'article'
				);

			card.className =
				'task-card';


			/* -------------------------------------------------
			   HEADING
			------------------------------------------------- */

			const heading =
				document.createElement(
					'div'
				);

			heading.className =
				'task-card-heading';


			heading.innerHTML = `
				<span>
					OOS - ${item.description}
				</span>

				<i
					class="task-chevron"
					data-lucide="chevron-down"
					aria-hidden="true"
				></i>
			`;


			card.appendChild(
				heading
			);


			/* -------------------------------------------------
			   BODY
			------------------------------------------------- */

			const body =
				document.createElement(
					'div'
				);

			body.className =
				'task-card-body';


			/* -------------------------------------------------
			   PRODUCT IMAGE
			------------------------------------------------- */

			const visual =
				document.createElement(
					'div'
				);

			visual.className =
				'task-card-visual';


			const imageUrl =
				item.imageUrl ||
				item.image?.url ||
				'';


			if (imageUrl) {

				const image =
					document.createElement(
						'img'
					);

				image.src =
					imageUrl;

				image.alt =
					item.imageAlt ||
					item.image?.alt ||
					item.description ||
					'Product image';


				visual.appendChild(
					image
				);

			} else {

				const placeholder =
					document.createElement(
						'div'
					);

				placeholder.className =
					'task-card-placeholder';

				placeholder.textContent =
					'No image';


				visual.appendChild(
					placeholder
				);

			}


			/* -------------------------------------------------
			   INVENTORY BUTTON
			------------------------------------------------- */

			const inventoryAction =
				document.createElement(
					'button'
				);

			inventoryAction.type =
				'button';

			inventoryAction.className =
				'task-action task-action-inventory';

			inventoryAction.setAttribute(
				'aria-label',
				'Inventory action'
			);

			inventoryAction.innerHTML =
				'<i data-lucide="archive"></i>';


			body.appendChild(
				visual
			);


			/* -------------------------------------------------
			   RIGHT CONTENT
			------------------------------------------------- */

			const rightContent =
				document.createElement(
					'div'
				);

			rightContent.className =
				'task-card-right';


			/* -------------------------------------------------
			   META
			------------------------------------------------- */

			const meta =
				document.createElement(
					'div'
				);

			meta.className =
				'task-card-meta';


			const department =
				departmentNames[
					String(
						item.department ?? ''
					)
				] ||
				'Bakery & Frozen';


			meta.innerHTML = `
				<span>
					Dept. ${department} (004)
				</span>

				<span>
					Aisle ${item.aisle || '—'}
				</span>

				<span>
					Side ${item.aisleSide || '—'}
				</span>

				<span>
					Bay ${item.bay || '—'}
				</span>
			`;


			rightContent.appendChild(
				meta
			);


			/* -------------------------------------------------
			   DETAILS
			------------------------------------------------- */

			const details =
				document.createElement(
					'div'
				);

			details.className =
				'task-card-details';


			details.innerHTML = `
				<p>
					<span>UPC</span>
					${item.upc}
				</p>

				<p>
					<span>On Hand</span>
					${item.onHand ?? 0} Units
				</p>

				<p>
					<span>Price</span>
					£${Number(
						item.price ?? 0
					).toFixed(2)}
				</p>

				<p>
					<span>Case Size</span>
					${item.caseSize ?? 0} Units
				</p>

				<p>
					<span>Item</span>
					${item.itemNumber || '—'}
				</p>

				<p>
					<span>MAX SHELF</span>
					${item.maxShelf ?? 0} Units
				</p>
			`;


			rightContent.appendChild(
				details
			);


			body.appendChild(
				rightContent
			);


			card.appendChild(
				body
			);


			/* -------------------------------------------------
			   ACTIONS
			------------------------------------------------- */

			const actions =
				document.createElement(
					'div'
				);

			actions.className =
				'task-card-actions';


			actions.appendChild(
				inventoryAction
			);


			const responseActions =
				document.createElement(
					'div'
				);

			responseActions.className =
				'task-response-actions';


			[
				[
					'thumbs-down',
					'Mark unavailable'
				],

				[
					'shopping-cart',
					'Send to backroom'
				],

				[
					'thumbs-up',
					'Mark available'
				]

			].forEach(
				([icon, label], index) => {

					const action =
						document.createElement(
							'button'
						);

					action.type =
						'button';

					action.className =
						`task-action task-action-${index + 1}`;

					action.setAttribute(
						'aria-label',
						label
					);

					action.innerHTML =
						`<i data-lucide="${icon}"></i>`;


					responseActions.appendChild(
						action
					);

				}
			);


			actions.appendChild(
				responseActions
			);


			card.appendChild(
				actions
			);


			taskCards.appendChild(
				card
			);

		}
	);


	/* Re-render Lucide icons */

	lucide.createIcons();

};


/* =========================================================
   OPEN ITEMS PAGE
========================================================= */

appMenuButton.addEventListener(
	'click',
	() => {

		console.log(
			'APP MENU CLICKED'
		);

		window.location.href =
			'admin-panel.html';

	}
);


/* =========================================================
   TASK SELECTION SLIDER
========================================================= */

const selectionStateKey =
	'asda-task-selection-state';


selectionSlider.classList.toggle(
	'is-on',
	localStorage.getItem(
		selectionStateKey
	) === 'on'
);


selectionSlider.addEventListener(
	'click',
	() => {

		const isOn =
			selectionSlider.classList.toggle(
				'is-on'
			);


		localStorage.setItem(
			selectionStateKey,
			isOn
				? 'on'
				: 'off'
		);

	}
);


/* =========================================================
   TASK CLOCK
========================================================= */

let taskClockStart =
	null;

let previousHour =
	null;


/* =========================================================
   GET TASK CLOCK FROM SERVER
========================================================= */

const getTaskClock = async () => {

	try {

		const response =
			await fetch(
				TASK_CLOCK_API
			);


		if (!response.ok) {

			throw new Error(
				'Unable to load task clock'
			);

		}


		const data =
			await response.json();


		taskClockStart =
			Number(
				data.startTime
			);


	} catch (error) {

		console.error(
			'Unable to load task clock:',
			error
		);

	}

};


/* =========================================================
   RENDER TASK CLOCK
========================================================= */

const renderTimer = () => {

	if (!taskClockStart) {
		return;
	}


	const elapsedSeconds =
		Math.floor(
			(Date.now() - taskClockStart) / 1000
		);


	/*
		Start the store clock at 9:00:00 AM.
	*/

	let totalSeconds =
		9 * 60 * 60 +
		elapsedSeconds;


	/*
		Keep the clock within 24 hours.
	*/

	totalSeconds =
		totalSeconds % (24 * 60 * 60);


	let hour =
		Math.floor(
			totalSeconds / 3600
		);


	const minute =
		Math.floor(
			(totalSeconds % 3600) / 60
		);


	const second =
		totalSeconds % 60;


	const period =
		hour >= 12
			? 'pm'
			: 'am';


	/*
		Convert to 12-hour format.
	*/

	hour =
		hour % 12;


	if (hour === 0) {
		hour = 12;
	}


	timerValue.textContent =
		`${hour}:` +
		`${minute
			.toString()
			.padStart(2, '0')}:` +
		`${second
			.toString()
			.padStart(2, '0')} ` +
		period;

};


/* =========================================================
   ADVANCE SERVER CLOCK BY ONE HOUR
========================================================= */

taskClock.addEventListener(
	'click',
	async () => {

		try {

			const response =
				await fetch(
					`${TASK_CLOCK_API}/advance-hour`,
					{
						method: 'POST'
					}
				);


			if (!response.ok) {

				throw new Error(
					'Unable to advance task clock'
				);

			}


			const data =
				await response.json();


			/*
				Update this page immediately
				with the new server time.
			*/

			taskClockStart =
				Number(
					data.startTime
				);


			renderTimer();


			/*
				Reset the previous hour so the
				next real hour transition still
				works correctly.
			*/

			previousHour =
				null;


			/*
				Generate a fresh set of tasks
				when the clock is manually advanced.
			*/

			renderRandomTasks();


		} catch (error) {

			console.error(
				'Unable to advance task clock:',
				error
			);

		}

	}
);


/* =========================================================
   CLOCK INTERVAL
========================================================= */

setInterval(
	() => {

		if (!taskClockStart) {
			return;
		}


		const elapsedSeconds =
			Math.floor(
				(Date.now() - taskClockStart) / 1000
			);


		const totalSeconds =
			(
				9 * 60 * 60
			) +
			elapsedSeconds;


		const currentHour =
			Math.floor(
				(
					totalSeconds %
					(24 * 60 * 60)
				) / 3600
			);


		/*
			Generate new random tasks whenever
			the store clock moves into a new hour.
		*/

		if (
			previousHour !== null &&
			currentHour !== previousHour
		) {

			renderRandomTasks();

		}


		previousHour =
			currentHour;


		renderTimer();

	},
	1000
);


/* =========================================================
   INITIALISE TASK CLOCK
========================================================= */

const initialiseTaskClock =
	async () => {

		await getTaskClock();

		renderTimer();


		/*
			Establish the current hour so the
			first interval doesn't trigger a
			task refresh unnecessarily.
		*/

		if (taskClockStart) {

			const elapsedSeconds =
				Math.floor(
					(Date.now() - taskClockStart) / 1000
				);


			const totalSeconds =
				(
					9 * 60 * 60
				) +
				elapsedSeconds;


			previousHour =
				Math.floor(
					(
						totalSeconds %
						(24 * 60 * 60)
					) / 3600
				);

		}

	};


initialiseTaskClock();


/* =========================================================
   FILTER PANEL
========================================================= */

const setFiltersOpen =
	(isOpen) => {

		filterPanel.hidden =
			!isOpen;

		scannerApp.classList.toggle(
			'filters-open',
			isOpen
		);

	};


/* =========================================================
   FILTER ELEMENTS
========================================================= */

const departmentDropdown =
	document.querySelector(
		'#department-dropdown'
	);

const departmentMenu =
	document.querySelector(
		'.department-menu'
	);

const taskTypeDropdown =
	document.querySelector(
		'#task-type-dropdown'
	);

const taskTypeMenu =
	document.querySelector(
		'.task-type-menu'
	);

const dueDateFilter =
	document.querySelector(
		'.due-date-filter'
	);

const dueDateMenu =
	document.querySelector(
		'#due-date-menu'
	);

const dueDateDropdown =
	document.querySelector(
		'#due-date-dropdown'
	);

const dueDateDropdownLabel =
	dueDateDropdown?.querySelector(
		'span:first-child'
	);

const taskStatusSelect =
	document.querySelector(
		'.filter-panel select'
	);


taskStatusSelect.addEventListener(
	'mousedown',
	() => {

		taskStatusSelect.classList.toggle(
			'is-open'
		);

	}
);


taskStatusSelect.addEventListener(
	'change',
	() => {

		taskStatusSelect.classList.remove(
			'is-open'
		);

	}
);


const departmentCheckboxes =
	document.querySelectorAll(
		'.department-option input[type="checkbox"]'
	);

const taskTypeCheckboxes =
	document.querySelectorAll(
		'.task-type-option input[type="checkbox"]'
	);


/* =========================================================
   FILTER STATE
========================================================= */

const filterStateKey =
	'asda-task-filter-state';


const defaultFilterState = {

	taskStatus:
		'Open tasks',

	departments:
		[],

	taskTypes:
		[
			'Manual Gap Scan',
			'Out-Of Stock'
		]

};


/* =========================================================
   TASK PAGE SESSION STATE
========================================================= */

const taskPageStateKey =
	'asda-task-page-state';


/* =========================================================
   SAVE TASK PAGE SESSION STATE
========================================================= */

const saveTaskPageState =
	() => {

		const selectedTaskTypes =
			[...taskTypeCheckboxes]
				.filter(
					checkbox =>
						checkbox.checked
				)
				.map(
					checkbox =>
						checkbox.value
				);


		const selectedDepartments =
			[...departmentCheckboxes]
				.filter(
					checkbox =>
						checkbox.checked
				)
				.map(
					checkbox =>
						checkbox.value
				);


		const state = {

			taskStatus:
				taskStatusSelect.value,

			taskTypes:
				selectedTaskTypes,

			departments:
				selectedDepartments,

			modularUPC:
				modularSearch
					?.value
					.trim() || ''

		};


		sessionStorage.setItem(
			taskPageStateKey,
			JSON.stringify(state)
		);

	};


/* =========================================================
   RESTORE TASK PAGE SESSION STATE
========================================================= */

const restoreTaskPageState =
	() => {

		let state =
			null;


		try {

			state =
				JSON.parse(
					sessionStorage.getItem(
						taskPageStateKey
					)
				);

		} catch (error) {

			state =
				null;

		}


		if (!state) {

			return false;

		}


		/* =====================================================
		   TASK STATUS
		===================================================== */

		if (
			state.taskStatus
		) {

			const option =
				[...taskStatusSelect.options]
					.find(
						option =>
							option.value ===
							state.taskStatus
					);


			if (option) {

				taskStatusSelect.value =
					state.taskStatus;

			}

		}


		/* =====================================================
		   DEPARTMENTS
		===================================================== */

		departmentCheckboxes.forEach(
			checkbox => {

				checkbox.checked =
					(
						state.departments ||
						[]
					).includes(
						checkbox.value
					);

			}
		);


		/* =====================================================
		   TASK TYPES
		===================================================== */

		taskTypeCheckboxes.forEach(
			checkbox => {

				checkbox.checked =
					(
						state.taskTypes ||
						[]
					).includes(
						checkbox.value
					);

			}
		);


		/* =====================================================
		   MODULAR UPC
		===================================================== */

		if (
			modularSearch
		) {

			modularSearch.value =
				state.modularUPC ||
				'';

		}


		return true;

	};


/* =========================================================
   UPDATE FILTER COUNT
========================================================= */

const updateFilterCount = () => {

	let count = 0;


	/* Task status */

	if (
		taskStatusSelect.options[
			taskStatusSelect.selectedIndex
		]?.textContent !==
		defaultFilterState.taskStatus
	) {

		count++;

	}


	/* Department checkboxes */

	departmentCheckboxes.forEach(
		(checkbox) => {

			const shouldBeChecked =
				defaultFilterState.departments.includes(
					checkbox.value
				);


			if (
				checkbox.checked !==
				shouldBeChecked
			) {

				count++;

			}

		}
	);


	/* Task type checkboxes */

	taskTypeCheckboxes.forEach(
		(checkbox) => {

			const shouldBeChecked =
				defaultFilterState.taskTypes.includes(
					checkbox.value
				);


			if (
				checkbox.checked !==
				shouldBeChecked
			) {

				count++;

			}

		}
	);


	filterLabel.textContent =
		`Filters (${count})`;

};


/* =========================================================
   MODULAR SEARCH CAMERA
========================================================= */

if (
	modularSearchCamera
) {

	modularSearchCamera.addEventListener(
		'click',
		event => {

			event.preventDefault();


			startBarcodeScanner(
				async (
					barcode
				) => {

					/*
						Stop the camera immediately.
					*/

					stopBarcodeScanner();


					/*
						Clean the scanned barcode.
					*/

					const cleanBarcode =
						String(barcode)
							.trim()
							.replace(/\D/g, '');


					/*
						Put the barcode into the
						modular search field.
					*/

					modularSearch.value =
						cleanBarcode;


					/*
						Trigger the existing search.
					*/

					modularSearch.dispatchEvent(
						new Event(
							'input',
							{
								bubbles: true
							}
						)
					);

				}
			);

		}
	);

}


/* =========================================================
   GET MODULAR ACTIVITY DATES
========================================================= */

const getModularActivityDates =
	async () => {

		try {

			const data =
				await apiRequest(
					MODULAR_ACTIVITY_DATES_API
				);


			if (!dueDateMenu) {
				return;
			}


			dueDateMenu.replaceChildren();


			const dates =
				[
					...new Set(
						data
							.map(
								row =>
									row.due_date
							)
							.filter(Boolean)
					)
				]
				.sort();


			dates.forEach(
				(date) => {

					const label =
						document.createElement(
							'label'
						);

					label.className =
						'due-date-option';


					const checkbox =
						document.createElement(
							'input'
						);

					checkbox.type =
						'checkbox';

					checkbox.value =
						date;


					const span =
						document.createElement(
							'span'
						);

					span.textContent =
						date;


					label.append(
						checkbox,
						span
					);


					dueDateMenu.appendChild(
						label
					);


					checkbox.addEventListener(
						'change',
						() => {

							updateDueDateLabel();

							saveTaskPageState();

							getModularActivity();

						}
					);

				}
			);


			updateDueDateLabel();

		} catch (error) {

			console.error(
				'Unable to load modular activity dates:',
				error
			);

		}

	};


/* =========================================================
   GET MODULAR ACTIVITY
========================================================= */

const getModularActivity =
	async () => {

		try {

			const selectedDates =
				[
					...dueDateMenu.querySelectorAll(
						'input[type="checkbox"]:checked'
					)
				]
				.map(
					checkbox =>
						checkbox.value
				);


			const searchUPC =
				modularSearch
					?.value
					.trim() || '';


			const queryParams =
				new URLSearchParams();


			if (
				selectedDates.length
			) {

				queryParams.set(
					'dueDates',
					selectedDates.join(',')
				);

			}


			if (
				searchUPC
			) {

				queryParams.set(
					'upc',
					searchUPC
				);

			}


			const query =
				queryParams.toString()
					? `?${queryParams.toString()}`
					: '';


			const data =
				await apiRequest(
					`${MODULAR_ACTIVITY_API}${query}`
				);


			console.log(
				'Modular activities:',
				data
			);


			if (!modularActivityCards) {
				return;
			}


			/* CLEAR EXISTING CARDS */

			modularActivityCards.replaceChildren();


			/* CREATE ONE CARD PER MODULAR ACTIVITY */

			data.forEach(
				(activity) => {

					const card =
						document.createElement(
							'div'
						);

					card.className =
						'modular-activity-card';


					/* =================================================
					   MAIN / TITLE AREA
					================================================= */

					const main =
						document.createElement(
							'div'
						);

					main.className =
						'modular-activity-card-main';


					/* ICON */

					const icon =
						document.createElement(
							'div'
						);

					icon.className =
						'modular-activity-card-icon';

					icon.innerHTML =
						'<i data-lucide="layout-grid"></i>';


					/* CONTENT */

					const content =
						document.createElement(
							'div'
						);

					content.className =
						'modular-activity-card-content';


					/* TITLE */

					const title =
						document.createElement(
							'div'
						);

					title.className =
						'modular-activity-card-title';


					const titleText =
						document.createElement(
							'span'
						);

					titleText.textContent =
						`MODULAR ACTIVITY - ${(
							activity.modular_name ||
							'MODULAR'
						).toUpperCase()}`;


					title.appendChild(
						titleText
					);


					content.append(
						title
					);


					main.append(
						icon,
						content
					);


					/* =================================================
					   PLANOGRAM AREA
					================================================= */

					const planogram =
						document.createElement(
							'div'
						);

					planogram.className =
						'modular-activity-card-planogram';


					/* PLANOGRAM NAME */

					const planogramName =
						document.createElement(
							'span'
						);

					planogramName.className =
						'modular-planogram-name';

					planogramName.textContent =
						`Planogram Name: ${activity.modular_name || '—'}`;


					/* PLANOGRAM NUMBER */

					const planogramNumber =
						document.createElement(
							'span'
						);

					planogramNumber.className =
						'modular-planogram-number';

					planogramNumber.textContent =
						`Planogram Number: ${activity.planogram_number || '—'}`;


					planogram.append(
						planogramName,
						planogramNumber
					);


					/* =================================================
					   EXECUTION DATE STATUS
					================================================= */

					const executionStatus =
						document.createElement(
							'div'
						);

					executionStatus.className =
						'modular-activity-execution-status';


					const [
						day,
						month,
						year
					] =
						activity.due_date.split('/');


					const dueDate =
						new Date(
							Number(year),
							Number(month) - 1,
							Number(day)
						);


					const today =
						new Date();


					today.setHours(
						0,
						0,
						0,
						0
					);


					const differenceMs =
						dueDate.getTime() -
						today.getTime();


					const differenceDays =
						Math.round(
							differenceMs /
							(1000 * 60 * 60 * 24)
						);


					/* =================================================
					   EXECUTION STATUS TEXT
					================================================= */

					const executionStatusText =
						document.createElement(
							'span'
						);

					executionStatusText.className =
						'modular-activity-execution-status-text';


					executionStatus.appendChild(
						executionStatusText
					);


					/* =================================================
					   UPCOMING
					================================================= */

					if (
						differenceDays > 0
					) {

						executionStatus.classList.add(
							'is-upcoming'
						);

						executionStatusText.textContent =
							`The modular is due ${differenceDays} day${
								differenceDays === 1
									? ''
									: 's'
							} from now`;


					/* =================================================
					   OVERDUE
					================================================= */

					} else if (
						differenceDays < 0
					) {

						executionStatus.classList.add(
							'is-overdue'
						);

						executionStatusText.textContent =
							`⚠ You're ${
								Math.abs(differenceDays)
							} day${
								Math.abs(differenceDays) === 1
									? ''
									: 's'
							} past your scheduled execution date`;


					/* =================================================
					   DUE TODAY
					================================================= */

					} else {

						executionStatus.classList.add(
							'is-today'
						);

						executionStatusText.textContent =
							'The modular is due today';

					}


					/* =================================================
					   MODULAR BAY SNAPSHOT
					================================================= */

					const modularSnapshot =
						document.createElement(
							'div'
						);

					modularSnapshot.className =
						'modular-activity-snapshot';


					const snapshotLoading =
						document.createElement(
							'div'
						);

					snapshotLoading.className =
						'modular-activity-snapshot-loading';

					snapshotLoading.textContent =
						'Loading modular visual...';


					modularSnapshot.appendChild(
						snapshotLoading
					);


					/* =================================================
					   COMPLETE CARD
					================================================= */

					card.append(
						main,
						planogram,
						executionStatus,
						modularSnapshot
					);


					modularActivityCards.appendChild(
						card
					);


					/* =================================================
   GENERATE BAY SNAPSHOT
================================================= */

createModularBaySnapshot(
	activity.planogram_number
)
	.then(
		snapshots => {

			if (
				!Array.isArray(snapshots) ||
				snapshots.length === 0
			) {

				modularSnapshot.replaceChildren();


				const empty =
					document.createElement(
						'div'
					);

				empty.className =
					'modular-activity-snapshot-empty';

				empty.textContent =
					'No modular visual available.';


				modularSnapshot.appendChild(
					empty
				);

				return;

			}


			/* =================================================
			   CREATE SNAPSHOT IMAGES
			================================================= */

			modularSnapshot.replaceChildren();


			snapshots.forEach(
				baySnapshot => {

					const snapshotWrapper =
						document.createElement(
							'div'
						);

					snapshotWrapper.className =
						'modular-activity-snapshot-bay';


					/* =================================================
					   BAY LABEL
					================================================= */

					const bayLabel =
						document.createElement(
							'div'
						);

					bayLabel.className =
						'modular-activity-snapshot-bay-label';

					bayLabel.textContent =
						`Bay ${baySnapshot.bayNumber}`;


					/* =================================================
					   IMAGE
					================================================= */

					const snapshotImage =
						document.createElement(
							'img'
						);

					snapshotImage.src =
						baySnapshot.snapshot;

					snapshotImage.alt =
						`Planogram ${activity.planogram_number} Bay ${baySnapshot.bayNumber} modular visual`;

					snapshotImage.className =
						'modular-activity-snapshot-image';


					/* =================================================
					   CLICK TO ENLARGE
					================================================= */

					snapshotImage.addEventListener(
						'click',
						() => {

							const enlarged =
								document.createElement(
									'img'
								);

							enlarged.src =
								baySnapshot.snapshot;

							enlarged.alt =
								snapshotImage.alt;

							enlarged.className =
								'modular-activity-snapshot-large';


							const overlay =
								document.createElement(
									'div'
								);

							overlay.className =
								'modular-activity-snapshot-overlay';


							overlay.appendChild(
								enlarged
							);


							overlay.addEventListener(
								'click',
								() => {

									overlay.remove();

								}
							);


							document.body.appendChild(
								overlay
							);

						}
					);


					snapshotWrapper.append(
						bayLabel,
						snapshotImage
					);


					modularSnapshot.appendChild(
						snapshotWrapper
					);

				}
			);


			/* =================================================
			   START BAR
			================================================= */

			const startBar =
				document.createElement(
					'button'
				);

			startBar.type =
				'button';

			startBar.className =
				'modular-activity-start';


			const startIcon =
				document.createElement(
					'i'
				);

			startIcon.setAttribute(
				'data-lucide',
				'circle-play'
			);


			const startText =
				document.createElement(
					'span'
				);

			startText.textContent =
				'START';


			startBar.append(
				startIcon,
				startText
			);


			/* =================================================
			   OPEN MODULAR ACTIVITY PAGE
			================================================= */

			startBar.addEventListener(
				'click',
				() => {

					/* =================================================
					   SAVE ONLY THE SELECTED MODULAR SNAPSHOTS
					================================================= */

					sessionStorage.setItem(
						`modular-snapshot-${activity.planogram_number}`,
						JSON.stringify(
							snapshots
						)
					);


					/* =================================================
					   BUILD ACTIVITY PAGE URL
					================================================= */

					const searchUPC =
						modularSearch
							?.value
							.trim() || '';


					const params =
						new URLSearchParams();


					params.set(
						'planogram',
						activity.planogram_number
					);

					params.set(
						'modularName',
						activity.modular_name || ''
					);

					params.set(
						'departmentNumber',
						activity.department_number || ''
					);

					params.set(
						'dueDate',
						activity.due_date || ''
					);


					if (
						searchUPC
					) {

						params.set(
							'upc',
							searchUPC
						);

					}


					window.location.href =
						`modular-activity.html?${params.toString()}`;

				}
			);


			modularSnapshot.appendChild(
				startBar
			);


			/* CREATE PLAY ICON */

			lucide.createIcons();

		}
	)
	.catch(
		error => {

			console.error(
				'Unable to create modular snapshot:',
				error
			);


			modularSnapshot.replaceChildren();


			const errorMessage =
				document.createElement(
					'div'
				);

			errorMessage.className =
				'modular-activity-snapshot-empty';

			errorMessage.textContent =
				'Unable to load modular visual.';


			modularSnapshot.appendChild(
				errorMessage
			);

		}
	);

				}
			);


			/* RECREATE LUCIDE ICONS */

			lucide.createIcons();


		} catch (error) {

			console.error(
				'Unable to load modular activity:',
				error
			);

		}

	};


/* =========================================================
   MODULAR SEARCH
========================================================= */

if (
	modularSearch
) {

	let searchTimeout = null;


	modularSearch.addEventListener(
		'input',
		() => {

			clearTimeout(
				searchTimeout
			);


			/*
				Save the UPC immediately so it survives
				navigation away from the Tasks page.
			*/

			saveTaskPageState();


			searchTimeout =
				setTimeout(
					() => {

						getModularActivity();

					},
					250
				);

		}
	);

}


/* =========================================================
   UPDATE DUE DATE LABEL
========================================================= */

const updateDueDateLabel =
	() => {

		if (
			!dueDateMenu ||
			!dueDateDropdownLabel
		) {

			return;

		}


		const selectedDates =
			[
				...dueDateMenu.querySelectorAll(
					'input[type="checkbox"]:checked'
				)
			];


		if (
			!selectedDates.length
		) {

			dueDateDropdownLabel.textContent =
				'All due dates';

			return;

		}


		if (
			selectedDates.length === 1
		) {

			dueDateDropdownLabel.textContent =
				selectedDates[0].value;

			return;

		}


		dueDateDropdownLabel.textContent =
			`${selectedDates.length} due dates`;

	};


/* =========================================================
   DUE DATE DROPDOWN
========================================================= */

dueDateDropdown.addEventListener(
	'click',
	() => {

		const isOpen =
			!dueDateMenu.hidden;


		departmentMenu.hidden =
			true;

		taskTypeMenu.hidden =
			true;


		departmentDropdown.classList.remove(
			'is-open'
		);

		taskTypeDropdown.classList.remove(
			'is-open'
		);


		dueDateMenu.hidden =
			isOpen;


		dueDateDropdown.classList.toggle(
			'is-open',
			!isOpen
		);

	}
);


/* =========================================================
   MODULAR ACTIVITY FILTER MODE
========================================================= */

const modularActivityCentre =
	document.querySelector(
		'#modular-activity-centre'
	);


const updateModularActivityMode = () => {

	const selectedTaskTypes =
		[...taskTypeCheckboxes]
			.filter(
				checkbox =>
					checkbox.checked
			)
			.map(
				checkbox =>
					checkbox.value
			);


	const modularActivityOnly =
		selectedTaskTypes.length === 1 &&
		selectedTaskTypes[0] ===
			'Modular Activity';


	/* =====================================================
	   DUE DATE FILTER
	===================================================== */

	if (
		dueDateFilter
	) {

		dueDateFilter.hidden =
			!modularActivityOnly;

	}


	/* =====================================================
	   TASK STATUS
	===================================================== */

	taskStatusSelect.disabled =
		modularActivityOnly;

	taskStatusSelect.classList.toggle(
		'is-disabled',
		modularActivityOnly
	);


	/* =====================================================
	   MODULAR ACTIVITY MODE
	===================================================== */

	if (
		modularActivityOnly
	) {

		/* Hide normal tasks */

		taskCards.replaceChildren();

		taskCards.style.display =
			'none';

		taskEmpty.style.display =
			'none';


		/* Show modular activity */

		if (
			modularActivityCentre
		) {

			modularActivityCentre.hidden =
				false;

		}


	} else {

		/* Show normal tasks */

		taskCards.style.display =
			'';

		taskEmpty.style.display =
			'';


		/* Hide modular activity */

		if (
			modularActivityCentre
		) {

			modularActivityCentre.hidden =
				true;

		}


		/* Restore normal tasks */

		renderRandomTasks();

	}

};


/* =========================================================
   SAVE FILTER STATE
========================================================= */

const saveFilterState =
	() => {

		const state = {

			taskStatus:
				taskStatusSelect.value,

			departments:
				[...departmentCheckboxes]
					.filter(
						checkbox =>
							checkbox.checked
					)
					.map(
						checkbox =>
							checkbox.value
					),

			taskTypes:
				[...taskTypeCheckboxes]
					.filter(
						checkbox =>
							checkbox.checked
					)
					.map(
						checkbox =>
							checkbox.value
					)

		};


		localStorage.setItem(
			filterStateKey,
			JSON.stringify(state)
		);

	};


/* =========================================================
   UPDATE DROPDOWN LABELS
========================================================= */

const updateFilterLabels =
	() => {

		const selectedDepartments =
			[...departmentCheckboxes]
				.filter(
					checkbox =>
						checkbox.checked
				)
				.map(
					checkbox =>
						checkbox.value
				);


		const selectedTaskTypes =
			[...taskTypeCheckboxes]
				.filter(
					checkbox =>
						checkbox.checked
				)
				.map(
					checkbox =>
						checkbox.value
				);


		/* Department */

		departmentDropdown
			.querySelector('span')
			.textContent =
				selectedDepartments.length === 0
					? 'All departments'
					: selectedDepartments.join(', ');


		/* Task type */

		taskTypeDropdown
			.querySelector('span')
			.textContent =
				selectedTaskTypes.length === 0
					? 'All task types'
					: selectedTaskTypes.join(', ');


		updateFilterCount();

		updateModularActivityMode();

	};


/* =========================================================
   LOAD FILTER STATE
========================================================= */

const loadFilterState =
	() => {

		let state =
			null;


		try {

			state =
				JSON.parse(
					localStorage.getItem(
						filterStateKey
					)
				);

		} catch (error) {

			state =
				null;

		}


		/* Use defaults if nothing is saved */

		if (
			!state
		) {

			state = {

				...defaultFilterState,

				departments:
					[
						...defaultFilterState.departments
					],

				taskTypes:
					[
						...defaultFilterState.taskTypes
					]

			};

		}


		/* =====================================================
		   TASK STATUS
		===================================================== */

		const statusOption =
			[...taskStatusSelect.options]
				.find(
					option =>
						option.textContent ===
						state.taskStatus
				);


		if (
			statusOption
		) {

			taskStatusSelect.value =
				statusOption.value;

		}


		/* =====================================================
		   DEPARTMENTS
		===================================================== */

		departmentCheckboxes.forEach(
			checkbox => {

				checkbox.checked =
					state.departments.includes(
						checkbox.value
					);

			}
		);


		/* =====================================================
		   TASK TYPES
		===================================================== */

		taskTypeCheckboxes.forEach(
			checkbox => {

				checkbox.checked =
					state.taskTypes.includes(
						checkbox.value
					);

			}
		);


		updateFilterLabels();

		saveFilterState();

	};


/* =========================================================
   OPEN FILTER PANEL
========================================================= */

filterButton.addEventListener(
	'click',
	() => {

		setFiltersOpen(
			filterPanel.hidden
		);

	}
);


/* =========================================================
   CLOSE FILTER PANEL
========================================================= */

closeFilters.addEventListener(
	'click',
	() => {

		setFiltersOpen(
			false
		);

	}
);


/* =========================================================
   DEPARTMENT DROPDOWN
========================================================= */

departmentDropdown.addEventListener(
	'click',
	() => {

		const isOpen =
			!departmentMenu.hidden;


		taskTypeMenu.hidden =
			true;

		dueDateMenu.hidden =
			true;


		taskTypeDropdown.classList.remove(
			'is-open'
		);

		dueDateDropdown.classList.remove(
			'is-open'
		);


		departmentMenu.hidden =
			isOpen;


		departmentDropdown.classList.toggle(
			'is-open',
			!isOpen
		);

	}
);


/* =========================================================
   TASK TYPE DROPDOWN
========================================================= */

taskTypeDropdown.addEventListener(
	'click',
	() => {

		const isOpen =
			!taskTypeMenu.hidden;


		departmentMenu.hidden =
			true;

		dueDateMenu.hidden =
			true;


		departmentDropdown.classList.remove(
			'is-open'
		);

		dueDateDropdown.classList.remove(
			'is-open'
		);


		taskTypeMenu.hidden =
			isOpen;


		taskTypeDropdown.classList.toggle(
			'is-open',
			!isOpen
		);

	}
);


/* =========================================================
   DEPARTMENT CHECKBOXES
========================================================= */

departmentCheckboxes.forEach(
	(checkbox) => {

		checkbox.addEventListener(
			'change',
			() => {

				updateFilterLabels();

				saveFilterState();

				saveTaskPageState();

			}
		);

	}
);


/* =========================================================
   TASK TYPE CHECKBOXES
========================================================= */

taskTypeCheckboxes.forEach(
	(checkbox) => {

		checkbox.addEventListener(
			'change',
			() => {

				updateFilterLabels();

				saveFilterState();

				saveTaskPageState();


				/*
					If Modular Activity is now selected,
					load its dates and activities.
				*/

				const selectedTaskTypes =
					[...taskTypeCheckboxes]
						.filter(
							checkbox =>
								checkbox.checked
						)
						.map(
							checkbox =>
								checkbox.value
						);


				const modularActivityOnly =
					selectedTaskTypes.length === 1 &&
					selectedTaskTypes[0] ===
						'Modular Activity';


				if (
					modularActivityOnly
				) {

					getModularActivityDates()
						.then(
							() =>
								getModularActivity()
						);

				}

			}
		);

	}
);


/* =========================================================
   TASK STATUS
========================================================= */

taskStatusSelect.addEventListener(
	'change',
	() => {

		updateFilterCount();

		saveFilterState();

		saveTaskPageState();

	}
);


/* =========================================================
   RESET FILTERS
========================================================= */

resetFilters.addEventListener(
	'click',
	() => {

		/* Task status */

		const openTasksOption =
			[...taskStatusSelect.options]
				.find(
					option =>
						option.textContent ===
						'Open tasks'
				);


		if (
			openTasksOption
		) {

			taskStatusSelect.value =
				openTasksOption.value;

		}


		/* Department = default: nothing selected */

		departmentCheckboxes.forEach(
			checkbox => {

				checkbox.checked =
					false;

			}
		);


		/* Task type = default selections */

		taskTypeCheckboxes.forEach(
			checkbox => {

				checkbox.checked =
					defaultFilterState.taskTypes.includes(
						checkbox.value
					);

			}
		);


		/* Clear modular UPC */

		if (
			modularSearch
		) {

			modularSearch.value =
				'';

		}


		/* Update labels and count */

		updateFilterLabels();

		saveFilterState();

		saveTaskPageState();


		/* Close dropdowns */

		departmentMenu.hidden =
			true;

		taskTypeMenu.hidden =
			true;

		dueDateMenu.hidden =
			true;


		departmentDropdown.classList.remove(
			'is-open'
		);

		taskTypeDropdown.classList.remove(
			'is-open'
		);

		dueDateDropdown.classList.remove(
			'is-open'
		);

	}
);


/* =========================================================
   APPLY FILTERS
========================================================= */

applyFilters.addEventListener(
	'click',
	async () => {

		saveFilterState();

		saveTaskPageState();

		updateFilterCount();


		const selectedTaskTypes =
			[...taskTypeCheckboxes]
				.filter(
					checkbox =>
						checkbox.checked
				)
				.map(
					checkbox =>
						checkbox.value
				);


		const modularActivityOnly =
			selectedTaskTypes.length === 1 &&
			selectedTaskTypes[0] ===
				'Modular Activity';


		/* =====================================================
		   LOAD FULL MODULAR ACTIVITY
		===================================================== */

		if (
			modularActivityOnly
		) {

			await getModularActivityDates();

			await getModularActivity();

		}


		setFiltersOpen(
			false
		);

	}
);


/* =========================================================
   INITIALISE FILTER STATE
========================================================= */

loadFilterState();


/* =========================================================
   RESTORE TASK PAGE SESSION STATE
========================================================= */

const restoredTaskPageState =
	restoreTaskPageState();


/* =========================================================
   UPDATE FILTER UI AFTER SESSION RESTORE
========================================================= */

updateFilterLabels();


/* =========================================================
   INITIALISE TASK PAGE
========================================================= */

const initialiseTaskPage =
	async () => {

		const selectedTaskTypes =
			[...taskTypeCheckboxes]
				.filter(
					checkbox =>
						checkbox.checked
				)
				.map(
					checkbox =>
						checkbox.value
				);


		const modularActivityOnly =
			selectedTaskTypes.length === 1 &&
			selectedTaskTypes[0] ===
				'Modular Activity';


		/* =====================================================
		   MODULAR ACTIVITY
		===================================================== */

		if (
			modularActivityOnly
		) {

			/*
				Make sure the modular activity
				section is visible.
			*/

			taskCards.replaceChildren();

			taskCards.style.display =
				'none';

			taskEmpty.style.display =
				'none';


			if (
				modularActivityCentre
			) {

				modularActivityCentre.hidden =
					false;

			}


			/*
				Load dates first because the
				date filter is generated dynamically.
			*/

			await getModularActivityDates();


			/*
				Then load the modular activity
				using the restored UPC.
			*/

			await getModularActivity();


			return;

		}


		/* =====================================================
		   NORMAL TASKS
		===================================================== */

		if (
			modularActivityCentre
		) {

			modularActivityCentre.hidden =
				true;

		}


		taskCards.style.display =
			'';

		taskEmpty.style.display =
			'';


		await renderRandomTasks();

	};


/* =========================================================
   INITIAL TASK LOAD
========================================================= */

initialiseTaskPage();