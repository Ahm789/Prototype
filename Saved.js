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
   SHELF EDITOR STATE
========================================================= */

let activeShelfIndex = null;

let draggedProductIndex = null;


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

		closeShelfEditor();


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

		closeShelfEditor();


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

		closeShelfEditor();


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

		if (
			shelfIndex < 0 ||
			shelfIndex >= regularModShelves.length
		) {

			return;

		}


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
		shelfIndex,
		onComplete = null
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


					if (
						typeof onComplete === 'function'
					) {

						onComplete();

					}

				}

		});

	};


/* =========================================================
   SHELF EDITOR STYLE
========================================================= */

const createShelfEditorStyles =
	() => {

		if (
			document.querySelector(
				'#regular-mod-shelf-editor-styles'
			)
		) {

			return;

		}


		const style =
			document.createElement(
				'style'
			);


		style.id =
			'regular-mod-shelf-editor-styles';


		style.textContent = `

			.regular-mod-shelf-editor {

				position: fixed;

				inset: 0;

				z-index: 9998;

				display: flex;

				align-items: center;

				justify-content: center;

				padding: 20px;

				box-sizing: border-box;

			}


			.regular-mod-shelf-editor[hidden] {

				display: none;

			}


			.regular-mod-shelf-editor-backdrop {

				position: absolute;

				inset: 0;

				background: rgba(0, 0, 0, 0.55);

				backdrop-filter: blur(2px);

			}


			.regular-mod-shelf-editor-dialog {

				position: relative;

				z-index: 1;

				width: 100%;

				max-width: 520px;

				max-height: calc(100vh - 40px);

				overflow: hidden;

				background: var(--paper);

				border-radius: 10px;

				box-shadow:
					0 18px 50px rgba(0, 0, 0, 0.25);

			}


			.regular-mod-shelf-editor-header {

				position: relative;

				display: flex;

				align-items: center;

				justify-content: center;

				min-height: 58px;

				padding: 0 52px;

				background: #0A928C;

				color: #ffffff;

				box-sizing: border-box;

			}


			.regular-mod-shelf-editor-title {

				margin: 0;

				font-size: 18px;

				font-weight: 700;

				text-align: center;

			}


			.regular-mod-shelf-editor-close {

				position: absolute;

				top: 50%;

				right: 12px;

				display: flex;

				align-items: center;

				justify-content: center;

				width: 34px;

				height: 34px;

				padding: 0;

				transform: translateY(-50%);

				border: 0;

				border-radius: 50%;

				background: transparent;

				color: #ffffff;

				font-size: 25px;

				cursor: pointer;

			}


			.regular-mod-shelf-editor-body {

				padding: 18px;

				overflow-y: auto;

			}


			.regular-mod-shelf-editor-upcs {

				margin-bottom: 14px;

				font-size: 13px;

				font-weight: 700;

				color: var(--text);

			}


			.regular-mod-shelf-editor-products {

				display: flex;

				align-items: center;

				gap: 10px;

				width: 100%;

				padding: 8px 4px 14px;

				overflow-x: auto;

				overflow-y: hidden;

				box-sizing: border-box;

			}


			.regular-mod-shelf-editor-product {

				position: relative;

				flex: 0 0 76px;

				width: 76px;

				height: 76px;

				border: 1px solid var(--border);

				border-radius: 6px;

				background: #ffffff;

				cursor: grab;

				user-select: none;

				box-sizing: border-box;

			}


			.regular-mod-shelf-editor-product:active {

				cursor: grabbing;

			}


			.regular-mod-shelf-editor-product.dragging {

				opacity: 0.45;

			}


			.regular-mod-shelf-editor-product img {

				display: block;

				width: 100%;

				height: 100%;

				object-fit: contain;

				border-radius: 6px;

			}


			.regular-mod-shelf-editor-remove {

				position: absolute;

				top: -7px;

				right: -7px;

				display: flex;

				align-items: center;

				justify-content: center;

				width: 22px;

				height: 22px;

				padding: 0;

				border: 2px solid #ffffff;

				border-radius: 50%;

				background: #dc2626;

				color: #ffffff;

				font-size: 16px;

				font-weight: 700;

				line-height: 1;

				cursor: pointer;

				z-index: 2;

			}


			.regular-mod-shelf-editor-scan {

				display: flex;

				align-items: center;

				justify-content: center;

				flex: 0 0 76px;

				width: 76px;

				height: 76px;

				border: 2px dashed #0A928C;

				border-radius: 6px;

				background: rgba(10, 146, 140, 0.06);

				color: #0A928C;

				cursor: pointer;

			}


			.regular-mod-shelf-editor-scan svg {

				width: 28px;

				height: 28px;

			}


			.regular-mod-shelf-editor-duplicates {

				min-height: 20px;

				margin-bottom: 14px;

				font-size: 12px;

				font-weight: 700;

				color: #dc2626;

			}


			.regular-mod-shelf-editor-tools {

				display: grid;

				grid-template-columns: repeat(3, 1fr);

				gap: 8px;

				margin-top: 4px;

			}


			.regular-mod-shelf-editor-tool {

				display: flex;

				align-items: center;

				justify-content: center;

				gap: 6px;

				min-height: 42px;

				padding: 8px;

				border: 1px solid var(--border);

				border-radius: 6px;

				background: var(--paper);

				color: var(--text);

				font: inherit;

				font-size: 12px;

				font-weight: 600;

				cursor: pointer;

			}


			.regular-mod-shelf-editor-tool svg {

				width: 16px;

				height: 16px;

			}


			.regular-mod-shelf-editor-actions {

				display: flex;

				gap: 10px;

				margin-top: 18px;

			}


			.regular-mod-shelf-editor-action {

				flex: 1;

				min-height: 44px;

				border: 0;

				border-radius: 6px;

				font: inherit;

				font-size: 13px;

				font-weight: 700;

				cursor: pointer;

			}


			.regular-mod-shelf-editor-finish {

				background: #78BE20;

				color: #ffffff;

			}


			.regular-mod-shelf-editor-next {

				background: #0A928C;

				color: #ffffff;

			}


			@media (max-width: 480px) {

				.regular-mod-shelf-editor-tools {

					grid-template-columns: 1fr;

				}

			}

		`;


		document.head.appendChild(
			style
		);

	};


/* =========================================================
   CREATE SHELF EDITOR
========================================================= */

const createShelfEditor =
	() => {

		if (
			document.querySelector(
				'#regular-mod-shelf-editor'
			)
		) {

			return;

		}


		createShelfEditorStyles();


		const editor =
			document.createElement(
				'div'
			);


		editor.id =
			'regular-mod-shelf-editor';


		editor.className =
			'regular-mod-shelf-editor';


		editor.hidden =
			true;


		editor.innerHTML = `

			<div
				class="regular-mod-shelf-editor-backdrop"
			></div>


			<div
				class="regular-mod-shelf-editor-dialog"
				role="dialog"
				aria-modal="true"
			>

				<div
					class="regular-mod-shelf-editor-header"
				>

					<h2
						class="regular-mod-shelf-editor-title"
						id="regular-mod-shelf-editor-title"
					>
						Shelf 1
					</h2>


					<button
						type="button"
						class="regular-mod-shelf-editor-close"
						id="regular-mod-shelf-editor-close"
						aria-label="Close shelf editor"
					>
						×
					</button>

				</div>


				<div
					class="regular-mod-shelf-editor-body"
				>

					<div
						class="regular-mod-shelf-editor-upcs"
						id="regular-mod-shelf-editor-upcs"
					>
						UPCs 0
					</div>


					<div
						class="regular-mod-shelf-editor-products"
						id="regular-mod-shelf-editor-products"
					>
					</div>


					<div
						class="regular-mod-shelf-editor-duplicates"
						id="regular-mod-shelf-editor-duplicates"
					>
					</div>


					<div
						class="regular-mod-shelf-editor-tools"
					>

						<button
							type="button"
							class="regular-mod-shelf-editor-tool"
							id="regular-mod-shelf-enter-upc"
						>

							<i
								data-lucide="scan-barcode"
								aria-hidden="true"
							></i>

							<span>
								Enter UPC
							</span>

						</button>


						<button
							type="button"
							class="regular-mod-shelf-editor-tool"
							id="regular-mod-shelf-cannot-scan"
						>

							<i
								data-lucide="triangle-alert"
								aria-hidden="true"
							></i>

							<span>
								Cannot Scan
							</span>

						</button>


						<button
							type="button"
							class="regular-mod-shelf-editor-tool"
							id="regular-mod-shelf-unstructured"
						>

							<i
								data-lucide="package-open"
								aria-hidden="true"
							></i>

							<span>
								Unstructured
							</span>

						</button>

					</div>


					<div
						class="regular-mod-shelf-editor-actions"
					>

						<button
							type="button"
							class="regular-mod-shelf-editor-action regular-mod-shelf-editor-finish"
							id="regular-mod-shelf-finish"
						>
							Finish
						</button>


						<button
							type="button"
							class="regular-mod-shelf-editor-action regular-mod-shelf-editor-next"
							id="regular-mod-shelf-next"
						>
							Next Shelf
						</button>

					</div>

				</div>

			</div>

		`;


		document.body.appendChild(
			editor
		);

	};


/* =========================================================
   SHELF EDITOR ELEMENTS
========================================================= */

createShelfEditor();


const shelfEditor =
	document.querySelector(
		'#regular-mod-shelf-editor'
	);


const shelfEditorTitle =
	document.querySelector(
		'#regular-mod-shelf-editor-title'
	);


const shelfEditorUpcs =
	document.querySelector(
		'#regular-mod-shelf-editor-upcs'
	);


const shelfEditorProducts =
	document.querySelector(
		'#regular-mod-shelf-editor-products'
	);


const shelfEditorDuplicates =
	document.querySelector(
		'#regular-mod-shelf-editor-duplicates'
	);


const shelfEditorClose =
	document.querySelector(
		'#regular-mod-shelf-editor-close'
	);


const shelfEditorFinish =
	document.querySelector(
		'#regular-mod-shelf-finish'
	);


const shelfEditorNext =
	document.querySelector(
		'#regular-mod-shelf-next'
	);


const shelfEditorEnterUpc =
	document.querySelector(
		'#regular-mod-shelf-enter-upc'
	);


const shelfEditorCannotScan =
	document.querySelector(
		'#regular-mod-shelf-cannot-scan'
	);


const shelfEditorUnstructured =
	document.querySelector(
		'#regular-mod-shelf-unstructured'
	);


/* =========================================================
   DUPLICATE PAIRS
========================================================= */

const getDuplicatePairCount =
	(
		products
	) => {

		const counts =
			new Map();


		products.forEach(
			product => {

				const upc =
					String(
						product.upc ?? ''
					).trim();


				if (!upc) {

					return;

				}


				counts.set(
					upc,
					(
						counts.get(upc) ||
						0
					) + 1
				);

			}
		);


		let pairs =
			0;


		counts.forEach(
			count => {

				if (
					count > 1
				) {

					pairs +=
						Math.floor(
							count / 2
						);

				}

			}
		);


		return pairs;

	};


/* =========================================================
   UPDATE SHELF EDITOR SUMMARY
========================================================= */

const updateShelfEditorSummary =
	() => {

		if (
			activeShelfIndex === null
		) {

			return;

		}


		const shelf =
			regularModShelves[
				activeShelfIndex
			];


		if (!shelf) {

			return;

		}


		const uniqueUpcs =
			new Set(
				shelf.products.map(
					product =>
						String(
							product.upc ?? ''
						).trim()
				)
			);


		shelfEditorUpcs.textContent =
			`UPCs ${uniqueUpcs.size}`;


		const duplicatePairs =
			getDuplicatePairCount(
				shelf.products
			);


		if (
			duplicatePairs > 0
		) {

			shelfEditorDuplicates.textContent =
				`Duplicates ${duplicatePairs} pairs`;

		}
		else {

			shelfEditorDuplicates.textContent =
				'';

		}

	};


/* =========================================================
   RENDER SHELF EDITOR PRODUCTS
========================================================= */

const renderShelfEditorProducts =
	() => {

		if (
			activeShelfIndex === null ||
			!shelfEditorProducts
		) {

			return;

		}


		const shelf =
			regularModShelves[
				activeShelfIndex
			];


		if (!shelf) {

			return;

		}


		shelfEditorProducts.innerHTML =
			'';


		shelf.products.forEach(
			(
				product,
				productIndex
			) => {

				const productCard =
					document.createElement(
						'div'
					);


				productCard.className =
					'regular-mod-shelf-editor-product';


				productCard.draggable =
					true;


				productCard.dataset.productIndex =
					productIndex;


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


				productCard.appendChild(
					image
				);


				const removeButton =
					document.createElement(
						'button'
					);


				removeButton.type =
					'button';


				removeButton.className =
					'regular-mod-shelf-editor-remove';


				removeButton.setAttribute(
					'aria-label',
					'Remove product'
				);


				removeButton.textContent =
					'−';


				removeButton.addEventListener(
					'click',
					event => {

						event.stopPropagation();


						shelf.products.splice(
							productIndex,
							1
						);


						markRegularModModified();


						renderShelfEditorProducts();


						renderModularVisual();

					}
				);


				productCard.appendChild(
					removeButton
				);


				/* =============================================
				   DRAG START
				============================================= */

				productCard.addEventListener(
					'dragstart',
					event => {

						draggedProductIndex =
							productIndex;


						productCard.classList.add(
							'dragging'
						);


						event.dataTransfer.effectAllowed =
							'move';

					}
				);


				/* =============================================
				   DRAG END
				============================================= */

				productCard.addEventListener(
					'dragend',
					() => {

						draggedProductIndex =
							null;


						productCard.classList.remove(
							'dragging'
						);

					}
				);


				/* =============================================
				   DRAG OVER
				============================================= */

				productCard.addEventListener(
					'dragover',
					event => {

						event.preventDefault();


						event.dataTransfer.dropEffect =
							'move';

					}
				);


				/* =============================================
				   DROP
				============================================= */

				productCard.addEventListener(
					'drop',
					event => {

						event.preventDefault();


						if (
							draggedProductIndex === null ||
							draggedProductIndex === productIndex
						) {

							return;

						}


						const draggedProduct =
							shelf.products.splice(
								draggedProductIndex,
								1
							)[0];


						let targetIndex =
							productIndex;


						if (
							draggedProductIndex <
							productIndex
						) {

							targetIndex--;

						}


						shelf.products.splice(
							targetIndex,
							0,
							draggedProduct
						);


						draggedProductIndex =
							null;


						markRegularModModified();


						renderShelfEditorProducts();


						renderModularVisual();

					}
				);


				shelfEditorProducts.appendChild(
					productCard
				);

			}
		);


		/* =============================================
		   FIXED CAMERA BUTTON
		============================================= */

		const scanButton =
			document.createElement(
				'button'
			);


		scanButton.type =
			'button';


		scanButton.className =
			'regular-mod-shelf-editor-scan';


		scanButton.setAttribute(
			'aria-label',
			'Scan product'
		);


		scanButton.innerHTML = `

			<i
				data-lucide="camera"
				aria-hidden="true"
			></i>

		`;


		scanButton.addEventListener(
			'click',
			() => {

				if (
					typeof window.startProductScanner ===
					'function'
				) {

					window.startProductScanner(
						{
							onScan:
								product => {

									if (
										!product
									) {

										return;

									}


									shelf.products.push(
										product
									);


									markRegularModModified();


									renderShelfEditorProducts();


									renderModularVisual();

								}
						}
					);

				}
				else {

					alert(
						'Product scanner is not connected yet.'
					);

				}

			}
		);


		shelfEditorProducts.appendChild(
			scanButton
		);


		if (
			window.lucide
		) {

			lucide.createIcons();

		}


		updateShelfEditorSummary();

	};


/* =========================================================
   OPEN SHELF EDITOR
========================================================= */

const openShelfEditor =
	(
		shelfIndex
	) => {

		if (
			shelfIndex < 0 ||
			shelfIndex >= regularModShelves.length
		) {

			return;

		}


		activeShelfIndex =
			shelfIndex;


		const shelf =
			regularModShelves[
				shelfIndex
			];


		if (
			shelfEditorTitle
		) {

			shelfEditorTitle.textContent =
				`Shelf ${shelf.shelf}`;

		}


		renderShelfEditorProducts();


		if (
			shelfEditor
		) {

			shelfEditor.hidden =
				false;

		}


		if (
			window.lucide
		) {

			lucide.createIcons();

		}

	};


/* =========================================================
   CLOSE SHELF EDITOR
========================================================= */

const closeShelfEditor =
	() => {

		if (
			shelfEditor
		) {

			shelfEditor.hidden =
				true;

		}


		activeShelfIndex =
			null;


		draggedProductIndex =
			null;

	};


/* =========================================================
   SHELF EDITOR CLOSE BUTTON
========================================================= */

if (shelfEditorClose) {

	shelfEditorClose.addEventListener(
		'click',
		() => {

			closeShelfEditor();

		}
	);

}


/* =========================================================
   SHELF EDITOR BACKDROP
========================================================= */

const shelfEditorBackdrop =
	document.querySelector(
		'.regular-mod-shelf-editor-backdrop'
	);


if (shelfEditorBackdrop) {

	shelfEditorBackdrop.addEventListener(
		'click',
		() => {

			closeShelfEditor();

		}
	);

}


/* =========================================================
   FINISH SHELF EDITOR
========================================================= */

if (shelfEditorFinish) {

	shelfEditorFinish.addEventListener(
		'click',
		() => {

			markRegularModModified();


			activeShelfIndex = null;

			activeShelfOriginalProducts = [];


			if (shelfEditor) {

				shelfEditor.hidden = true;

			}


			shelfEditor.classList.remove(
				'active'
			);


			renderModularVisual();

		}
	);

}


/* =========================================================
   NEXT SHELF
========================================================= */

if (shelfEditorNext) {

	shelfEditorNext.addEventListener(
		'click',
		() => {

			if (
				activeShelfIndex === null
			) {

				return;

			}


			const nextShelfIndex =
				activeShelfIndex + 1;


			/* =============================================
			   SAVE CURRENT SHELF
			============================================= */

			markRegularModModified();


			/* =============================================
			   INSERT EMPTY SHELF AFTER CURRENT
			============================================= */

			regularModShelves.splice(
				nextShelfIndex,
				0,
				{
					shelf: 0,
					products: []
				}
			);


			renumberRegularModShelves();


			/* =============================================
			   MOVE TO NEW SHELF
			============================================= */

			activeShelfIndex =
				nextShelfIndex;


			markRegularModModified();


			renderModularVisual();


			openShelfEditor(
				nextShelfIndex
			);

		}
	);

}


/* =========================================================
   ENTER UPC
========================================================= */

if (shelfEditorEnterUpc) {

	shelfEditorEnterUpc.addEventListener(
		'click',
		() => {

			if (
				activeShelfIndex === null
			) {

				return;

			}


			const upc =
				window.prompt(
					'Enter UPC'
				);


			if (
				!upc
			) {

				return;

			}


			console.log(
				'UPC entered:',
				upc
			);


			/*
				PRODUCT LOOKUP WILL BE CONNECTED
				HERE ONCE THE UPC SEARCH ROUTE
				IS WIRED INTO THIS PAGE.
			*/

		}
	);

}


/* =========================================================
   CANNOT SCAN
========================================================= */

if (shelfEditorCannotScan) {

	shelfEditorCannotScan.addEventListener(
		'click',
		() => {

			console.log(
				'Cannot Scan selected.'
			);

		}
	);

}


/* =========================================================
   UNSTRUCTURED
========================================================= */

if (shelfEditorUnstructured) {

	shelfEditorUnstructured.addEventListener(
		'click',
		() => {

			console.log(
				'Unstructured selected.'
			);

		}
	);

}


/* =========================================================
   RENDER REGULAR MOD VISUAL
========================================================= */

const renderModularVisual =
	() => {

		if (!modularVisual) {

			return;

		}


		modularVisual.innerHTML =
			'';


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
					event => {

						event.stopPropagation();


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
					event => {

						event.stopPropagation();


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
				   PRODUCT AREA CLICK
				============================================= */

				productsContainer.addEventListener(
					'click',
					() => {

						openShelfEditor(
							shelfIndex
						);

					}
				);


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
						event => {

							event.stopPropagation();


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


			regularModShelves =
				[];


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