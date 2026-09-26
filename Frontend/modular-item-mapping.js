const selectedModularId =
	localStorage.getItem(
		'selectedModularId'
	);


const regularModName =
	document.querySelector(
		'#regular-mod-name'
	);


if (regularModName) {

	if (selectedModularId) {

		regularModName.textContent =
			`UPDATING (${selectedModularId})`;

	}
	else {

		regularModName.textContent =
			'UPDATING';

	}

}

/* =========================================================
   REGULAR MOD BACK BUTTON
========================================================= */

const regularModBack =
	document.querySelector(
		'#regular-mod-back'
	);


if (regularModBack) {

	regularModBack.addEventListener(
		'click',
		() => {

			window.history.back();

		}
	);

}