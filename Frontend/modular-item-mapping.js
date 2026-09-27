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


const API_BASE =
	`${API_ORIGIN}/api/products`;


/* =========================================================
   API REQUEST
========================================================= */

const apiRequest =
	async (
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
   GET MODULAR PRODUCTS
========================================================= */

const getModularProducts =
	async (
		modularId
	) => {

		return apiRequest(
			`${API_BASE}/modular/${encodeURIComponent(modularId)}`
		);

	};


/* =========================================================
   SELECTED MODULAR
========================================================= */

const selectedModularId =
	localStorage.getItem(
		'selectedModularId'
	);


/* =========================================================
   REGULAR MOD NAME
========================================================= */

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
   REGULAR MOD ELEMENTS
========================================================= */

const modularVisual =
	document.querySelector(
		'#modular-visual'
	);


const regularModUpdate =
	document.querySelector(
		'#regular-mod-update'
	);


const regularModBack =
	document.querySelector(
		'#regular-mod-back'
	);


const regularModCancel =
	document.querySelector(
		'#regular-mod-cancel'
	);


const regularModReset =
	document.querySelector(
		'#regular-mod-reset'
	);

const regularModClear =
	document.querySelector(
		'#regular-modular-clear'
	);
/* =========================================================
   CONFIRMATION MODAL ELEMENTS
========================================================= */

const clearModal =
	document.querySelector(
		'#modular-clear-modal'
	);


const clearModalTitle =
	document.querySelector(
		'#modular-clear-modal-title'
	);


const clearModalMessage =
	document.querySelector(
		'#modular-clear-modal-message'
	);


const clearModalCancel =
	document.querySelector(
		'#modular-clear-modal-cancel'
	);


const clearModalConfirm =
	document.querySelector(
		'#modular-clear-modal-confirm'
	);


const clearModalBackdrop =
	document.querySelector(
		'[data-clear-modal-close]'
	);


/* =========================================================
   REGULAR MOD STATE
========================================================= */

let regularModShelves = [];

let regularModOriginalShelves = [];

let regularModModified = false;


/* =========================================================
   CONFIRMATION MODAL STATE
========================================================= */

let confirmationAction = null;


/* =========================================================
   OPEN CONFIRMATION MODAL
========================================================= */

const openConfirmationModal =
	({
		title,
		message,
		confirmText,
		onConfirm
	}) => {

		if (
			!clearModal ||
			!clearModalTitle ||
			!clearModalMessage ||
			!clearModalConfirm
		) {

			return;

		}


		clearModalTitle.textContent =
			title;


		clearModalMessage.textContent =
			message;


		clearModalConfirm.textContent =
			confirmText;


		confirmationAction =
			onConfirm;


		clearModal.hidden =
			false;


		if (
			window.lucide
		) {

			lucide.createIcons();

		}

	};


/* =========================================================
   CLOSE CONFIRMATION MODAL
========================================================= */

const closeConfirmationModal =
	() => {

		if (!clearModal) {

			return;

		}


		clearModal.hidden =
			true;


		confirmationAction =
			null;

	};


/* =========================================================
   CONFIRMATION MODAL - CANCEL
========================================================= */

if (clearModalCancel) {

	clearModalCancel.addEventListener(
		'click',
		() => {

			closeConfirmationModal();

		}
	);

}


/* =========================================================
   CONFIRMATION MODAL - BACKDROP
========================================================= */

if (clearModalBackdrop) {

	clearModalBackdrop.addEventListener(
		'click',
		() => {

			closeConfirmationModal();

		}
	);

}


/* =========================================================
   CONFIRMATION MODAL - CONFIRM
========================================================= */

if (clearModalConfirm) {

	clearModalConfirm.addEventListener(
		'click',
		() => {

			const action =
				confirmationAction;


			closeConfirmationModal();


			if (
				typeof action === 'function'
			) {

				action();

			}

		}
	);

}


/* =========================================================
   UPDATE BUTTON STATE
========================================================= */

const updateRegularModButton =
	() => {

		if (!regularModUpdate) {

			return;

		}


		const hasEmptyShelf =
			regularModShelves.some(
				shelf =>
					shelf.products.length === 0
			);


		regularModUpdate.disabled =
			!regularModModified ||
			hasEmptyShelf;

	};


/* =========================================================
   MARK REGULAR MOD AS MODIFIED
========================================================= */

const markRegularModModified =
	() => {

		regularModModified =
			true;

		updateRegularModButton();

	};


/* =========================================================
   RENUMBER SHELVES
========================================================= */

const renumberRegularModShelves =
	() => {

		regularModShelves.forEach(
			(
				shelf,
				index
			) => {

				shelf.shelf =
					index + 1;

			}
		);

	};


/* =========================================================
   INSERT SHELF
========================================================= */

const insertRegularModShelf =
	(
		index
	) => {

		regularModShelves.splice(
			index,
			0,
			{
				shelf: 0,
				products: []
			}
		);


		renumberRegularModShelves();


		markRegularModModified();


		renderModularVisual();

	};


/* =========================================================
   LEAVE WITHOUT SAVING
========================================================= */

const leaveRegularMod =
	() => {

		window.history.back();

	};


/* =========================================================
   CONFIRM LEAVE
========================================================= */

const confirmLeaveRegularMod =
	() => {

		openConfirmationModal({
			title:
				'Leave Without Saving?',

			message:
				'Are you sure you want to leave this modular without saving your changes?',

			confirmText:
				'Leave',

			onConfirm:
				leaveRegularMod
		});

	};


/* =========================================================
   REGULAR MOD BACK BUTTON
========================================================= */

if (regularModBack) {

	regularModBack.addEventListener(
		'click',
		() => {

			confirmLeaveRegularMod();

		}
	);

}


/* =========================================================
   REGULAR MOD CANCEL BUTTON
========================================================= */

if (regularModCancel) {

	regularModCancel.addEventListener(
		'click',
		() => {

			confirmLeaveRegularMod();

		}
	);

}


/* =========================================================
   RESET MODULAR
========================================================= */

const resetRegularMod =
	() => {

		regularModShelves =
			JSON.parse(
				JSON.stringify(
					regularModOriginalShelves
				)
			);


		regularModModified =
			false;


		renderModularVisual();

	};

/* =========================================================
   CLEAR MODULAR
========================================================= */

const clearRegularMod =
	() => {

		regularModShelves =
			[];


		regularModModified =
			true;


		renderModularVisual();

	};


/* =========================================================
   CONFIRM CLEAR MODULAR
========================================================= */

const confirmClearRegularMod =
	() => {

		openConfirmationModal({
			title:
				'Clear Modular?',

			message:
				'Are you sure you want to clear this modular? All shelves and items will be removed from the current edit.',

			confirmText:
				'Clear Modular',

			onConfirm:
				clearRegularMod
		});

	};


/* =========================================================
   REGULAR MOD CLEAR BUTTON
========================================================= */

if (regularModClear) {

	regularModClear.addEventListener(
		'click',
		() => {

			confirmClearRegularMod();

		}
	);

}
/* =========================================================
   CONFIRM RESET MODULAR
========================================================= */

const confirmResetRegularMod =
	() => {

		openConfirmationModal({
			title:
				'Reset Modular?',

			message:
				'Are you sure you want to reset this modular? All unsaved changes will be removed.',

			confirmText:
				'Reset Modular',

			onConfirm:
				resetRegularMod
		});

	};


/* =========================================================
   REGULAR MOD RESET BUTTON
========================================================= */

if (regularModReset) {

	regularModReset.addEventListener(
		'click',
		() => {

			confirmResetRegularMod();

		}
	);

}


/* =========================================================
   REMOVE SHELF
========================================================= */

const removeRegularModShelf =
	(
		shelfIndex
	) => {

		regularModShelves.splice(
			shelfIndex,
			1
		);


		renumberRegularModShelves();


		markRegularModModified();


		renderModularVisual();

	};


/* =========================================================
   CONFIRM REMOVE SHELF
========================================================= */

const confirmRemoveRegularModShelf =
	(
		shelfIndex
	) => {

		const shelfNumber =
			regularModShelves[
				shelfIndex
			]?.shelf;


		if (
			typeof shelfNumber !== 'number'
		) {

			return;

		}


		openConfirmationModal({
			title:
				`Remove Shelf ${shelfNumber}?`,

			message:
				`Are you sure you want to remove Shelf ${shelfNumber}? All products currently on this shelf will be removed from the current edit.`,

			confirmText:
				'Remove Shelf',

			onConfirm:
				() => {

					removeRegularModShelf(
						shelfIndex
					);

				}
		});

	};


/* =========================================================
   RENDER REGULAR MOD VISUAL
========================================================= */

const renderModularVisual =
	() => {

		if (!modularVisual) {

			return;

		}


		modularVisual.innerHTML = '';


		/* =====================================================
		   NO SHELVES
		===================================================== */

		if (
			regularModShelves.length === 0
		) {

			const plusButton =
				document.createElement(
					'button'
				);


			plusButton.type =
				'button';


			plusButton.className =
				'regular-mod-shelf-add regular-mod-shelf-add-bottom';


			plusButton.setAttribute(
				'aria-label',
				'Add shelf'
			);


			plusButton.innerHTML =
				'<span>+</span>';


			plusButton.addEventListener(
				'click',
				() => {

					insertRegularModShelf(
						0
					);

				}
			);


			modularVisual.appendChild(
				plusButton
			);


			updateRegularModButton();

			return;

		}


		/* =====================================================
		   CREATE SHELVES
		===================================================== */

		regularModShelves.forEach(
			(
				shelfData,
				shelfIndex
			) => {

				/* =============================================
				   PLUS ABOVE SHELF
				============================================= */

				const plusAbove =
					document.createElement(
						'button'
					);


				plusAbove.type =
					'button';


				plusAbove.className =
					'regular-mod-shelf-add';


				plusAbove.setAttribute(
					'aria-label',
					`Add shelf above Shelf ${shelfData.shelf}`
				);


				plusAbove.innerHTML =
					'<span>+</span>';


				plusAbove.addEventListener(
					'click',
					() => {

						insertRegularModShelf(
							shelfIndex
						);

					}
				);


				modularVisual.appendChild(
					plusAbove
				);


				/* =============================================
				   SHELF
				============================================= */

				const shelfContainer =
					document.createElement(
						'div'
					);


				shelfContainer.className =
					'regular-mod-shelf';


				/* =============================================
				   SHELF HEADER
				============================================= */

				const shelfHeader =
					document.createElement(
						'div'
					);


				shelfHeader.className =
					'regular-mod-shelf-header';


				/* =============================================
				   LEFT SIDE
				============================================= */

				const shelfHeaderLeft =
					document.createElement(
						'div'
					);


				shelfHeaderLeft.className =
					'regular-mod-shelf-header-left';


				/* =============================================
				   MORE BUTTON
				============================================= */

				const moreButton =
					document.createElement(
						'button'
					);


				moreButton.type =
					'button';


				moreButton.className =
					'regular-mod-shelf-more';


				moreButton.setAttribute(
					'aria-label',
					`Shelf ${shelfData.shelf} options`
				);


				moreButton.innerHTML = `
					<i
						data-lucide="more-vertical"
						aria-hidden="true"
					></i>
				`;


				/* =============================================
				   SHELF LABEL
				============================================= */

				const shelfLabel =
					document.createElement(
						'div'
					);


				shelfLabel.className =
					'regular-mod-shelf-label';


				shelfLabel.textContent =
					`Shelf ${shelfData.shelf}`;


				/* =============================================
				   UPC COUNT
				============================================= */

				const upcCount =
					document.createElement(
						'div'
					);


				upcCount.className =
					'regular-mod-upc-count';


				const uniqueUpcs =
					new Set(
						shelfData.products.map(
							product =>
								String(
									product.upc ?? ''
								).trim()
						)
					);


				upcCount.textContent =
					`UPCs ${uniqueUpcs.size}`;


				shelfHeaderLeft.appendChild(
					moreButton
				);


				shelfHeaderLeft.appendChild(
					shelfLabel
				);


				shelfHeaderLeft.appendChild(
					upcCount
				);


				/* =============================================
				   REMOVE BUTTON
				============================================= */

				const removeButton =
					document.createElement(
						'button'
					);


				removeButton.type =
					'button';


				removeButton.className =
					'regular-mod-shelf-remove';


				removeButton.setAttribute(
					'aria-label',
					`Remove Shelf ${shelfData.shelf}`
				);


				removeButton.innerHTML =
					'<span>−</span>';


				removeButton.addEventListener(
					'click',
					() => {

						confirmRemoveRegularModShelf(
							shelfIndex
						);

					}
				);


				/* =============================================
				   BUILD HEADER
				============================================= */

				shelfHeader.appendChild(
					shelfHeaderLeft
				);


				shelfHeader.appendChild(
					removeButton
				);


				/* =============================================
				   PRODUCT AREA
				============================================= */

				const productsContainer =
					document.createElement(
						'div'
					);


				productsContainer.className =
					'regular-mod-products';


				/* =============================================
				   CREATE PRODUCTS
				============================================= */

				shelfData.products.forEach(
					product => {

						const productCard =
							document.createElement(
								'div'
							);


						productCard.className =
							'regular-mod-product';


						const image =
							document.createElement(
								'img'
							);


						const imageUrl =
							product.image?.url ||
							product.imageUrl ||
							product.image_url ||
							'';


						image.src =
							imageUrl;


						image.alt =
							product.image?.alt ||
							product.description ||
							'Product';


						image.className =
							'regular-mod-product-image';


						productCard.appendChild(
							image
						);


						productsContainer.appendChild(
							productCard
						);

					}
				);


				/* =============================================
				   BUILD SHELF
				============================================= */

				shelfContainer.appendChild(
					shelfHeader
				);


				shelfContainer.appendChild(
					productsContainer
				);


				modularVisual.appendChild(
					shelfContainer
				);


				/* =============================================
				   FINAL SHELF PLUS BELOW
				============================================= */

				if (
					shelfIndex ===
					regularModShelves.length - 1
				) {

					const plusBelow =
						document.createElement(
							'button'
						);


					plusBelow.type =
						'button';


					plusBelow.className =
						'regular-mod-shelf-add regular-mod-shelf-add-bottom';


					plusBelow.setAttribute(
						'aria-label',
						'Add shelf below'
					);


					plusBelow.innerHTML =
						'<span>+</span>';


					plusBelow.addEventListener(
						'click',
						() => {

							insertRegularModShelf(
								regularModShelves.length
							);

						}
					);


					modularVisual.appendChild(
						plusBelow
					);

				}

			}
		);


		/* =====================================================
		   INITIALISE LUCIDE ICONS
		===================================================== */

		if (
			window.lucide
		) {

			lucide.createIcons();

		}


		updateRegularModButton();

	};


/* =========================================================
   LOAD SELECTED REGULAR MOD
========================================================= */

const loadRegularMod =
	async (
		modularId
	) => {

		try {

			const products =
				await getModularProducts(
					modularId
				);


			regularModShelves = [];


			/* =================================================
			   EMPTY MODULAR
			================================================= */

			if (
				!Array.isArray(products) ||
				products.length === 0
			) {

				regularModOriginalShelves =
					[];


				regularModModified =
					false;


				renderModularVisual();

				return;

			}


			/* =================================================
			   GROUP PRODUCTS BY SHELF
			================================================= */

			const shelves =
				new Map();


			products.forEach(
				product => {

					const shelf =
						parseInt(
							String(
								product.shelf ?? ''
							).replace(
								/[^0-9]/g,
								''
							),
							10
						);


					if (
						Number.isNaN(
							shelf
						)
					) {

						return;

					}


					if (
						!shelves.has(shelf)
					) {

						shelves.set(
							shelf,
							[]
						);

					}


					shelves
						.get(shelf)
						.push(
							product
						);

				}
			);


			/* =================================================
			   CREATE SHELF STATE
			================================================= */

			regularModShelves =
				[
					...shelves.entries()
				]
					.sort(
						(
							[
								shelfA
							],
							[
								shelfB
							]
						) => {

							return (
								shelfA -
								shelfB
							);

						}
					)
					.map(
						(
							[
								shelf,
								shelfProducts
							]
						) => {

							shelfProducts.sort(
								(
									productA,
									productB
								) => {

									const orderA =
										Number(
											productA.order
										);


									const orderB =
										Number(
											productB.order
										);


									if (
										Number.isNaN(
											orderA
										)
									) {

										return 1;

									}


									if (
										Number.isNaN(
											orderB
										)
									) {

										return -1;

									}


									return (
										orderA -
										orderB
									);

								}
							);


							return {
								shelf,
								products:
									shelfProducts
							};

						}
					);


			/* =================================================
			   NORMALISE SHELF NUMBERS
			================================================= */

			renumberRegularModShelves();


			/* =================================================
			   SAVE ORIGINAL STATE
			================================================= */

			regularModOriginalShelves =
				JSON.parse(
					JSON.stringify(
						regularModShelves
					)
				);


			regularModModified =
				false;


			renderModularVisual();

		}
		catch (error) {

			console.error(
				'Failed to load modular:',
				error
			);


			if (modularVisual) {

				modularVisual.innerHTML = `
					<div class="regular-mod-empty">
						Unable to load modular.
					</div>
				`;

			}

		}

	};


/* =========================================================
   LOAD MODULAR
========================================================= */

if (selectedModularId) {

	loadRegularMod(
		selectedModularId
	);

}
else {

	regularModShelves = [];

	regularModOriginalShelves = [];

	renderModularVisual();

}