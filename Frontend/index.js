const API_BASE =
	'http://localhost:3000/api/products';



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

let clockHour =
	9;

let clockMinute =
	0;

let clockSecond =
	0;

let clockPeriod =
	'am';



const renderTimer = () => {

	timerValue.textContent =
		`${clockHour}:` +
		`${clockMinute
			.toString()
			.padStart(2, '0')}:` +
		`${clockSecond
			.toString()
			.padStart(2, '0')} ` +
		clockPeriod;

};



taskClock.addEventListener(
	'click',
	() => {

		clockMinute =
			59;

		clockSecond =
			55;


		renderTimer();

	}
);



/* =========================================================
   CLOCK INTERVAL
========================================================= */

setInterval(
	() => {

		clockSecond += 1;


		if (
			clockSecond === 60
		) {

			clockSecond =
				0;

			clockMinute +=
				1;

		}


		if (
			clockMinute === 60
		) {

			clockMinute =
				0;

			clockHour +=
				1;


			if (
				clockHour === 12
			) {

				clockPeriod =
					clockPeriod === 'am'
						? 'pm'
						: 'am';

			} else if (
				clockHour > 12
			) {

				clockHour =
					1;

			}


			/*
				Generate the next set of
				random tasks whenever the
				hour changes.
			*/

			renderRandomTasks();

		}


		renderTimer();

	},
	1000
);



renderTimer();



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



filterButton.addEventListener(
	'click',
	() => {

		setFiltersOpen(
			filterPanel.hidden
		);

	}
);



closeFilters.addEventListener(
	'click',
	() => {

		setFiltersOpen(
			false
		);

	}
);



/* =========================================================
   RESET FILTERS
========================================================= */

resetFilters.addEventListener(
	'click',
	() => {

		filterSelects.forEach(
			(select) => {

				select.selectedIndex =
					0;

			}
		);


		filterLabel.textContent =
			'Filters (0)';

	}
);



/* =========================================================
   APPLY FILTERS
========================================================= */

applyFilters.addEventListener(
	'click',
	() => {

		setFiltersOpen(
			false
		);


		filterLabel.textContent =
			'Filters (1)';

	}
);



/* =========================================================
   INITIAL TASK LOAD
========================================================= */

renderRandomTasks();
