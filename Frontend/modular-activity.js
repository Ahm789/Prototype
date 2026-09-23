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


const modularActivityName =
	document.querySelector(
		'#modular-activity-name'
	);


const modularActivityBack =
	document.querySelector(
		'#modular-activity-back'
	);


/* =========================================================
   GET MODULAR ACTIVITY DATA
========================================================= */

const params =
	new URLSearchParams(
		window.location.search
	);


const planogramNumber =
	params.get(
		'planogram'
	);


const modularName =
	params.get(
		'modularName'
	);


const departmentNumber =
	params.get(
		'departmentNumber'
	);


const dueDate =
	params.get(
		'dueDate'
	);


const searchUPC =
	params.get(
		'upc'
	) || '';


/* =========================================================
   LOAD MODULAR NAME
========================================================= */

if (
	modularActivityName
) {

	modularActivityName.textContent =
		modularName ||
		'MODULAR';

}


/* =========================================================
   BACK BUTTON
========================================================= */

if (
	modularActivityBack
) {

	modularActivityBack.addEventListener(
		'click',
		() => {

			const backParams =
				new URLSearchParams();


			/*
				Return to the Tasks page
				with Modular Activity selected.
			*/

			backParams.set(
				'modularActivity',
				'true'
			);


			/*
				Restore the UPC search
				if one was entered.
			*/

			if (
				searchUPC
			) {

				backParams.set(
					'upc',
					searchUPC
				);

			}


			window.location.href =
				`index.html?${backParams.toString()}`;

		}
	);

}


/* =========================================================
   INITIALISE
========================================================= */

lucide.createIcons();