/* =========================================================
   API CONFIGURATION
========================================================= */

const isLocal =
	window.location.protocol === 'file:' ||
	window.location.hostname === 'localhost' ||
	window.location.hostname === '127.0.0.1';


const API_ORIGIN =
	isLocal
		? 'http://localhost:3000'
		: '';


const ITEM_MAPPING_API_BASE =
	`${API_ORIGIN}/api/products`;


/* =========================================================
   ELEMENTS
========================================================= */

const modularCount =
	document.querySelector(
		'#item-mapping-mod-count'
	);


const modularList =
	document.querySelector(
		'#item-mapping-mod-list'
	);

/* =========================================================
   MODULAR TAG SEARCH BUTTON
========================================================= */

const itemMappingSearchSubmit =
	document.querySelector(
		'#item-mapping-search-submit'
	);


if (itemMappingSearchSubmit) {

	itemMappingSearchSubmit.addEventListener(
		'click',
		() => {

			filterModularTags();

		}
	);

}
/* =========================================================
   LOAD MODULAR TAGS
========================================================= */

const loadModularTags =
	async () => {

		try {

			const response =
				await fetch(
					`${ITEM_MAPPING_API_BASE}/modular-tags`
				);


			if (!response.ok) {

				throw new Error(
					`Failed to fetch modular tags: ${response.status}`
				);

			}


			const modularTags =
				await response.json();


			allModularTags =
                modularTags;

            renderModularTags(
                allModularTags
            );

		}
		catch (error) {

			console.error(
				'Unable to load modular tags:',
				error
			);


			if (modularList) {

				modularList.innerHTML = `
					<div class="item-mapping-mod-error">
						Unable to load modular tags.
					</div>
				`;

			}


			if (modularCount) {

				modularCount.textContent =
					'0';

			}

		}

	};

/* =========================================================
   MODULAR TAG SEARCH - ENTER
========================================================= */

const itemMappingSearchInput =
	document.querySelector(
		'#item-mapping-search-input'
	);


if (itemMappingSearchInput) {

	itemMappingSearchInput.addEventListener(
		'keydown',
		(event) => {

			if (
				event.key === 'Enter'
			) {

				event.preventDefault();

				filterModularTags();

			}

		}
	);

}
/* =========================================================
   FORMAT MODULAR ID
========================================================= */

const formatModularId =
	(modularId) => {

		if (!modularId) {

			return '';

		}


		return modularId
			.trim()
			.replace(
				/-/g,
				' '
			);

	};

/* =========================================================
   MODULAR TAG SEARCH
========================================================= */

let allModularTags = [];


const filterModularTags =
	() => {

		const searchInput =
			document.querySelector(
				'#item-mapping-search-input'
			);


		if (!searchInput) {

			return;

		}


		const searchValue =
			searchInput.value
				.trim()
				.toUpperCase();


		if (!searchValue) {

			renderModularTags(
				allModularTags
			);

			return;

		}


		const filteredTags =
			allModularTags.filter(
				tag =>
					String(
						tag.modular_id || ''
					)
						.toUpperCase()
						.includes(
							searchValue
						)
			);


		renderModularTags(
			filteredTags
		);

	};
/* =========================================================
   RENDER MODULAR TAGS
========================================================= */

const renderModularTags =
	(modularTags) => {

		if (!modularList) {

			return;

		}


		modularList.innerHTML =
			'';


		if (
			!Array.isArray(
				modularTags
			) ||
			modularTags.length === 0
		) {

			if (modularCount) {

				modularCount.textContent =
					'0';

			}


			return;

		}


		if (modularCount) {

			modularCount.textContent =
				modularTags.length;

		}


		modularTags.forEach(
			(tag) => {

				const row =
					document.createElement(
						'div'
					);


				row.className =
					'item-mapping-mod-row';


				/* =================================================
				   STATUS
				================================================= */

				const status =
					document.createElement(
						'div'
					);


				status.className =
					'item-mapping-mod-status';


				status.textContent =
					tag.active
						? 'Active'
						: 'Inactive';


				/* =================================================
				   MODULAR ID PARTS
				================================================= */

				const parts =
					(tag.modular_id || '')
						.trim()
						.split('-');


				const dep =
					document.createElement(
						'div'
					);


				dep.className =
					'item-mapping-mod-part';


				dep.textContent =
					parts[0] || '';


				const aisle =
					document.createElement(
						'div'
					);


				aisle.className =
					'item-mapping-mod-part';


				aisle.textContent =
					parts[1] || '';


				const side =
					document.createElement(
						'div'
					);


				side.className =
					'item-mapping-mod-part';


				side.textContent =
					parts[2] || '';


				const mod =
					document.createElement(
						'div'
					);


				mod.className =
					'item-mapping-mod-part';


				mod.textContent =
					parts[3] || '';


				/* =================================================
				   DIVIDER AFTER STATUS
				================================================= */

				const dividerBeforeDep =
					document.createElement(
						'div'
					);


				dividerBeforeDep.className =
					'item-mapping-table-divider';


				dividerBeforeDep.textContent =
					'|';


				/* =================================================
				   DIVIDER BEFORE DISCREPANCY
				================================================= */

				const dividerBeforeDiscrepancy =
					document.createElement(
						'div'
					);


				dividerBeforeDiscrepancy.className =
					'item-mapping-table-divider';


				dividerBeforeDiscrepancy.textContent =
					'|';


				/* =================================================
				   DISCREPANCY
				================================================= */

				const discrepancy =
					document.createElement(
						'div'
					);


				discrepancy.className =
					'item-mapping-mod-discrepancy';


				discrepancy.textContent =
					'100%';


				/* =================================================
				   MORE BUTTON
				================================================= */

				const moreButton =
					document.createElement(
						'button'
					);


				moreButton.className =
					'item-mapping-mod-more';


				moreButton.type =
					'button';


				moreButton.setAttribute(
					'aria-label',
					`More options for ${tag.modular_id}`
				);


				moreButton.innerHTML = `
					<i
						data-lucide="more-vertical"
						aria-hidden="true"
					></i>
				`;


				/* =================================================
				   BUILD ROW
				================================================= */

				row.appendChild(
					status
				);


				row.appendChild(
					dividerBeforeDep
				);


				row.appendChild(
					dep
				);


				row.appendChild(
					aisle
				);


				row.appendChild(
					side
				);


				row.appendChild(
					mod
				);


				row.appendChild(
					dividerBeforeDiscrepancy
				);


				row.appendChild(
					discrepancy
				);


				row.appendChild(
					moreButton
				);


				modularList.appendChild(
					row
				);

			}
		);

		/* =====================================================
		   INITIALISE NEW LUCIDE ICONS
		===================================================== */

		if (
			window.lucide
		) {

			lucide.createIcons();

		}

	};

/* =========================================================
MOD TAG CAMERA SEARCH
========================================================= */

const itemMappingSearchCamera =
    document.querySelector(
        '#item-mapping-search-camera'
    );


if (itemMappingSearchCamera) {

    itemMappingSearchCamera.addEventListener(
        'click',
        async () => {

            await startModularTagScanner(
                (modularTag) => {

                    const selectedModularId =
                        String(
                            modularTag || ''
                        )
                            .trim()
                            .toUpperCase();


                    if (!selectedModularId) {

                        return;

                    }


                    /* =============================================
                    SAVE SELECTED MODULAR
                    ============================================= */

                    localStorage.setItem(
                        'selectedModularId',
                        selectedModularId
                    );


                    /* =============================================
                    OPEN MODULAR ITEM MAPPING
                    ============================================= */

                    window.location.href =
                        'modular-item-mapping.html';

                }
            );

        }
    );

}
/* =========================================================
   INITIALISE ITEM MAPPING
========================================================= */

loadModularTags();