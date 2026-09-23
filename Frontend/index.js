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
   RETURN FROM MODULAR ACTIVITY
========================================================= */

const pageParams =
	new URLSearchParams(
		window.location.search
	);


const returnedFromModularActivity =
	pageParams.get(
		'modularActivity'
	) === 'true';


const returnedModularUPC =
	pageParams.get(
		'upc'
	) || '';

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
   CREATE MODULAR BAY SNAPSHOT
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
		   TEMPORARY MODULAR VISUAL
		===================================================== */

		const modularVisual =
			document.createElement(
				'div'
			);

		modularVisual.className =
			'modular-visual';


		/*
			Use a fixed width so the generated snapshot
			has a predictable layout.
		*/

		modularVisual.style.width =
			'fit-content';

		modularVisual.style.maxWidth =
			'none';

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


		document.body.appendChild(
			modularVisual
		);


		/* =====================================================
		   GROUP PRODUCTS BY SHELF
		===================================================== */

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


		/* =====================================================
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


		/* =====================================================
		   CREATE SHELVES
		===================================================== */

		sortedShelves.forEach(
			([
				shelf,
				shelfProducts
			]) => {

				/*
					shelf_order controls left → right.
				*/

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

			}
		);


		/* =====================================================
		   WAIT FOR LAYOUT
		===================================================== */

		await new Promise(
			resolve =>
				requestAnimationFrame(
					resolve
				)
		);


		const shelfHeight =
			90;

		const gap =
			8;


		/* =====================================================
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


			const shelfWidth =
				productsContainer.clientWidth;


			/* =================================================
			   LOAD PRODUCT IMAGES
			================================================= */

			const loadedProducts =
				await Promise.all(
					shelfProducts
						.filter(
							product =>
								product.image &&
								product.image.url
						)
						.map(
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
											product.image.url;

									}
								)
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


			/* =================================================
			   DIVIDE SHELF BETWEEN PRODUCTS
			================================================= */

			const productWidth =
				(
					shelfWidth -
					(
						(
							usableProducts.length - 1
						) *
						gap
					)
				) /
				usableProducts.length;


			/* =================================================
			   CREATE FACINGS
			================================================= */

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


		/* =====================================================
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


		await new Promise(
			resolve =>
				requestAnimationFrame(
					() =>
						requestAnimationFrame(
							resolve
						)
				)
		);


		/* =====================================================
		   CREATE SNAPSHOT
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
						true
				}
			);


		const snapshot =
			canvas.toDataURL(
				'image/png'
			);


		/* =====================================================
		   REMOVE TEMPORARY VISUAL
		===================================================== */

		modularVisual.remove();


		return snapshot;

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
		console.log('APP MENU CLICKED');

		window.location.href =
			'items.html';
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
				when the clock is manually
				advanced.
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
						updateDueDateLabel
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


			if (selectedDates.length) {

				queryParams.set(
					'dueDates',
					selectedDates.join(',')
				);

			}


			if (searchUPC) {

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

if (differenceDays > 0) {

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

} else if (differenceDays < 0) {

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
					   COMPLETE CARD
					================================================= */

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
		snapshot => {

			if (!snapshot) {

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


			const snapshotImage =
				document.createElement(
					'img'
				);

			snapshotImage.src =
				snapshot;

			snapshotImage.alt =
				`Planogram ${activity.planogram_number} modular visual`;

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
						snapshot;

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


			modularSnapshot.replaceChildren(
				snapshotImage
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

		const searchUPC =
			modularSearch
				?.value
				.trim() || '';


		const params =
			new URLSearchParams();


		/*
			Pass the selected modular activity data.
		*/

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


		/*
			Pass the UPC search if one was entered.
		*/

		if (searchUPC) {

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
if (modularSearch) {

	let searchTimeout = null;


	modularSearch.addEventListener(
		'input',
		() => {

			clearTimeout(
				searchTimeout
			);


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


	if (!selectedDates.length) {

		dueDateDropdownLabel.textContent =
			'All due dates';

		return;
	}


	if (selectedDates.length === 1) {

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
				(checkbox) =>
					checkbox.checked
			)
			.map(
				(checkbox) =>
					checkbox.value
			);


	const modularActivityOnly =
		selectedTaskTypes.length === 1 &&
		selectedTaskTypes[0] ===
			'Modular Activity';


	/* =====================================================
	   DUE DATE FILTER
	===================================================== */

	if (dueDateFilter) {

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
	   NORMAL TASK AREA
	===================================================== */

	if (modularActivityOnly) {

	taskCards.replaceChildren();

	taskCards.style.display =
		'none';

	taskEmpty.style.display =
		'none';


	/* ================================================
	   SHOW MODULAR ACTIVITY
	================================================ */

	if (modularActivityCentre) {

		modularActivityCentre.hidden =
			false;

	}


	/* ================================================
	   LOAD MODULAR ACTIVITY
	================================================ */

	getModularActivityDates();

} else {

		taskCards.style.display =
			'';

		taskEmpty.style.display =
			'';


		/* ================================================
		   HIDE MODULAR ACTIVITY
		================================================ */

		if (modularActivityCentre) {

			modularActivityCentre.hidden =
				true;

		}

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
						(checkbox) =>
							checkbox.checked
					)
					.map(
						(checkbox) =>
							checkbox.value
					),

			taskTypes:
				[...taskTypeCheckboxes]
					.filter(
						(checkbox) =>
							checkbox.checked
					)
					.map(
						(checkbox) =>
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
					(checkbox) =>
						checkbox.checked
				)
				.map(
					(checkbox) =>
						checkbox.value
				);

		const selectedTaskTypes =
			[...taskTypeCheckboxes]
				.filter(
					(checkbox) =>
						checkbox.checked
				)
				.map(
					(checkbox) =>
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

		if (!state) {

			state = {
				...defaultFilterState,

				departments:
					[...defaultFilterState.departments],

				taskTypes:
					[...defaultFilterState.taskTypes]

			};

		}
		/* =====================================================
		RETURNING FROM MODULAR ACTIVITY
		===================================================== */

		if (
			returnedFromModularActivity
		) {

			state.taskTypes =
				[
					'Modular Activity'
				];

		}


		/* Task status */

		const statusOption =
			[...taskStatusSelect.options]
				.find(
					(option) =>
						option.textContent ===
						state.taskStatus
				);


		if (statusOption) {

			taskStatusSelect.value =
				statusOption.value;

		}


		/* Departments */

		departmentCheckboxes.forEach(
			(checkbox) => {

				checkbox.checked =
					state.departments.includes(
						checkbox.value
					);

			}
		);


		/* Task types */

		taskTypeCheckboxes.forEach(
			(checkbox) => {

				checkbox.checked =
					state.taskTypes.includes(
						checkbox.value
					);

			}
		);

		updateModularActivityMode();
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

		taskTypeDropdown.classList.remove(
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

		departmentDropdown.classList.remove(
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
					(option) =>
						option.textContent ===
						'Open tasks'
				);

		if (openTasksOption) {

			taskStatusSelect.value =
				openTasksOption.value;

		}


		/* Department = default: nothing selected */

		departmentCheckboxes.forEach(
			(checkbox) => {

				checkbox.checked =
					false;

			}
		);


		/* Task type = default selections */

		taskTypeCheckboxes.forEach(
			(checkbox) => {

				checkbox.checked =
					defaultFilterState.taskTypes.includes(
						checkbox.value
					);

			}
		);


		/* Update labels and count */

		updateFilterLabels();

		saveFilterState();

		updateModularActivityMode();

		/* Close dropdowns */

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

	}
);
/* =========================================================
   APPLY FILTERS
========================================================= */

/* =========================================================
   APPLY FILTERS
========================================================= */

applyFilters.addEventListener(
	'click',
	async () => {

		saveFilterState();

		updateFilterCount();


		const selectedTaskTypes =
			[...taskTypeCheckboxes]
				.filter(
					(checkbox) =>
						checkbox.checked
				)
				.map(
					(checkbox) =>
						checkbox.value
				);


		const modularActivityOnly =
			selectedTaskTypes.length === 1 &&
			selectedTaskTypes[0] ===
				'Modular Activity';


		/* =====================================================
		   LOAD FULL MODULAR ACTIVITY
		===================================================== */

		if (modularActivityOnly) {

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
   RETURN FROM MODULAR ACTIVITY
========================================================= */

const initialiseReturnedModularActivity =
	async () => {

		if (
			!returnedFromModularActivity
		) {

			return;

		}


		/* =====================================================
		   RESTORE UPC SEARCH
		===================================================== */

		if (
			modularSearch
		) {

			modularSearch.value =
				returnedModularUPC;

		}


		/* =====================================================
		   MAKE SURE MODULAR ACTIVITY MODE IS ACTIVE
		===================================================== */

		updateModularActivityMode();


		/* =====================================================
		   LOAD AVAILABLE DUE DATES
		===================================================== */

		await getModularActivityDates();


		/* =====================================================
		   RUN MODULAR ACTIVITY SEARCH
		===================================================== */

		await getModularActivity();

	};


/* =========================================================
   INITIAL TASK LOAD
========================================================= */

if (
	returnedFromModularActivity
) {

	initialiseReturnedModularActivity();

} else {

	renderRandomTasks();

}