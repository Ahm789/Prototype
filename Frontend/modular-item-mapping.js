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

let activeShelfOriginalProducts = [];

let draggedProductIndex = null;

let freshShelfCreatedByNext = false;


/* =========================================================
   CONFIRMATION MODAL STATE
========================================================= */

let confirmationAction = null;


/* =========================================================
   SHARED BARCODE SCANNER STATE
========================================================= */

let cameraStream = null;

let cameraVideo = null;

let cameraOverlay = null;

let barcodeReader = null;

let barcodeControls = null;

let barcodeScanLocked = false;


/* =========================================================
   CREATE CAMERA UI
========================================================= */

const createCameraScanner =
	() => {

		if (
			cameraOverlay
		) {

			return;

		}


		cameraOverlay =
			document.createElement(
				'div'
			);


		cameraOverlay.className =
			'barcode-camera-overlay';


		cameraOverlay.innerHTML = `

			<div class="barcode-camera-container">

				<div class="barcode-camera-header">

					<strong>
						Scan Barcode
					</strong>


					<button
						type="button"
						class="barcode-camera-close"
						aria-label="Close camera"
					>

						<i
							data-lucide="x"
						></i>

					</button>

				</div>


				<div class="barcode-camera-view">

					<video
						class="barcode-camera-video"
						autoplay
						playsinline
						muted
					></video>


					<div class="barcode-scan-frame">

						<div class="barcode-scan-line"></div>

					</div>

				</div>


				<div class="barcode-camera-status">

					Point the camera at a barcode

				</div>

			</div>

		`;


		document.body.appendChild(
			cameraOverlay
		);


		cameraVideo =
			cameraOverlay.querySelector(
				'.barcode-camera-video'
			);


		const closeButton =
			cameraOverlay.querySelector(
				'.barcode-camera-close'
			);


		closeButton.addEventListener(
			'click',
			stopBarcodeScanner
		);


		if (
			window.lucide
		) {

			lucide.createIcons();

		}

	};


/* =========================================================
   START BARCODE SCANNER
========================================================= */

const startBarcodeScanner =
	async (
		onBarcodeDetected
	) => {

		createCameraScanner();

		if (
			shelfEditor
		) {

			shelfEditor.hidden =
				true;

		}


		barcodeScanLocked =
			false;

		barcodeScanLocked =
			false;


		try {

			cameraOverlay.classList.add(
				'active'
			);


			barcodeReader =
				new ZXingBrowser.BrowserMultiFormatReader();


			const devices =
				await ZXingBrowser
					.BrowserCodeReader
					.listVideoInputDevices();


			if (
				!devices ||
				devices.length === 0
			) {

				throw new Error(
					'No camera found.'
				);

			}


			let selectedDevice =
				devices.find(
					device =>
						/environment|back|rear/i.test(
							device.label
						)
				);


			if (!selectedDevice) {

				selectedDevice =
					devices[
						devices.length - 1
					];

			}


			barcodeControls =
				await barcodeReader.decodeFromVideoDevice(
					selectedDevice.deviceId,
					cameraVideo,
					async (
						result,
						error
					) => {

						if (
							barcodeScanLocked
						) {

							return;

						}


						if (
							result
						) {

							const barcode =
								result.getText();


							if (
								barcode
							) {

								barcodeScanLocked =
									true;


								await onBarcodeDetected(
									barcode
								);

							}

						}

					}
				);

		}
		catch (error) {

			console.error(
				'Unable to start barcode scanner:',
				error
			);


			stopBarcodeScanner();


			alert(
				'Unable to access the camera. Please check your camera permission.'
			);

		}

	};


/* =========================================================
   STOP BARCODE SCANNER
========================================================= */

const stopBarcodeScanner =
	() => {

		barcodeScanLocked =
			true;


		if (
			barcodeControls
		) {

			try {

				barcodeControls.stop();

			}
			catch (error) {

				console.error(
					'Unable to stop barcode scanner:',
					error
				);

			}


			barcodeControls =
				null;

		}


		if (
			barcodeReader
		) {

			try {

				barcodeReader.reset();

			}
			catch (error) {

				console.error(
					'Unable to reset barcode reader:',
					error
				);

			}


			barcodeReader =
				null;

		}


		if (
			cameraStream
		) {

			cameraStream
				.getTracks()
				.forEach(
					track => {

						track.stop();

					}
				);


			cameraStream =
				null;

		}


		if (
			cameraVideo
		) {

			cameraVideo.pause();

			cameraVideo.srcObject =
				null;

		}


		if (
			cameraOverlay
		) {

			cameraOverlay.classList.remove(
				'active'
			);

		}
				if (
			shelfEditor &&
			activeShelfIndex !== null
		) {

			shelfEditor.hidden =
				false;

		}

	};


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
   SHELF EDITOR ELEMENTS
========================================================= */

const shelfEditor =
	document.querySelector(
		'#regular-mod-shelf-modal'
	);


const shelfEditorTitle =
	document.querySelector(
		'#regular-mod-shelf-modal-title'
	);


const shelfEditorUpcs =
	document.querySelector(
		'#regular-mod-shelf-modal-upc-label'
	);


const shelfEditorProducts =
	document.querySelector(
		'#regular-mod-shelf-modal-products'
	);


const shelfEditorDuplicates =
	document.querySelector(
		'#regular-mod-shelf-modal-duplicates'
	);


const shelfEditorClose =
	document.querySelector(
		'#regular-mod-shelf-modal-close'
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


const shelfEditorBackdrop =
	document.querySelector(
		'.regular-mod-shelf-modal-backdrop'
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


		if (shelfEditorUpcs) {

			shelfEditorUpcs.innerHTML = `

				<span>
					Shelf ${shelf.shelf}
				</span>

				<span class="regular-mod-upc-badge">
					UPC's ${uniqueUpcs.size}
				</span>

			`;

		}


		const duplicatePairs =
			getDuplicatePairCount(
				shelf.products
			);


		if (
			shelfEditorDuplicates
		) {

			if (
				duplicatePairs > 0
			) {

				shelfEditorDuplicates.hidden =
					false;


				shelfEditorDuplicates.textContent =
					`Duplicates ${duplicatePairs} pairs`;

			}
			else {

				shelfEditorDuplicates.hidden =
					true;


				shelfEditorDuplicates.textContent =
					'';

			}

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


		/* =============================================
		   CAMERA / ADD PRODUCT TILE
		============================================= */

		const scanButton =
			document.createElement(
				'button'
			);


		scanButton.type =
			'button';


		scanButton.className =
			'regular-mod-shelf-modal-scan';


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


		/* =============================================
		   CAMERA BUTTON
		============================================= */

		scanButton.addEventListener(
			'click',
			event => {

				event.preventDefault();
				event.stopPropagation();


				startBarcodeScanner(
					async barcode => {

						try {

							const results =
								await apiRequest(
									`${API_BASE}/search?q=${encodeURIComponent(barcode)}`
								);


							if (
								!Array.isArray(results) ||
								results.length === 0
							) {

								stopBarcodeScanner();


								alert(
									`No product found for barcode ${barcode}.`
								);


								return;

							}


							const product =
								results[0];


							shelf.products.push(
								product
							);


							markRegularModModified();


							stopBarcodeScanner();


							renderShelfEditorProducts();


							renderModularVisual();

						}
						catch (error) {

							console.error(
								'Failed to find scanned product:',
								error
							);


							stopBarcodeScanner();


							alert(
								'Unable to find the scanned product.'
							);

						}

					}
				);

			}
		);


		/* =============================================
		   CAMERA FIRST
		============================================= */

		shelfEditorProducts.appendChild(
			scanButton
		);


		/* =============================================
		   PRODUCTS
		============================================= */

		shelf.products.forEach(
			(
				product,
				productIndex
			) => {

				/* =============================================
				   DROP ZONE BEFORE PRODUCT
				============================================= */

				const dropZone =
					document.createElement(
						'div'
					);


				dropZone.className =
					'regular-mod-shelf-modal-drop-zone';


				dropZone.addEventListener(
					'dragover',
					event => {

						event.preventDefault();


						event.dataTransfer.dropEffect =
							'move';

					}
				);


				dropZone.addEventListener(
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
					dropZone
				);


				/* =============================================
				   PRODUCT CARD
				============================================= */

				const productCard =
					document.createElement(
						'div'
					);


				productCard.className =
					'regular-mod-shelf-modal-product';


				productCard.draggable =
					true;


				productCard.dataset.productIndex =
					productIndex;


				/* =============================================
				   PRODUCT IMAGE
				============================================= */

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


				/* =============================================
				   DELETE BUTTON
				============================================= */

				const removeButton =
					document.createElement(
						'button'
					);


				removeButton.type =
					'button';


				removeButton.className =
					'regular-mod-shelf-modal-remove';


				removeButton.setAttribute(
					'aria-label',
					'Remove product'
				);


				removeButton.innerHTML = `

					−

				`;


				removeButton.addEventListener(
					'click',
					event => {

						event.preventDefault();
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
				   DROP ON PRODUCT
				============================================= */

				productCard.addEventListener(
					'dragover',
					event => {

						event.preventDefault();


						if (
							draggedProductIndex === null ||
							draggedProductIndex === productIndex
						) {

							return;

						}


						event.dataTransfer.dropEffect =
							'move';

					}
				);


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


		/* =============================================
		   SAVE ORIGINAL SHELF STATE
		============================================= */

		activeShelfOriginalProducts =
			JSON.parse(
				JSON.stringify(
					shelf.products
				)
			);


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
	(
		saveChanges = false
	) => {

		/* =============================================
		   REMOVE EMPTY SHELF CREATED BY NEXT
		============================================= */

		if (
			!saveChanges &&
			freshShelfCreatedByNext &&
			activeShelfIndex !== null &&
			regularModShelves[activeShelfIndex] &&
			regularModShelves[
				activeShelfIndex
			].products.length === 0
		) {

			regularModShelves.splice(
				activeShelfIndex,
				1
			);


			renumberRegularModShelves();

		}

		/* =============================================
		   CANCEL - RESTORE ORIGINAL SHELF
		============================================= */

		else if (
			!saveChanges &&
			activeShelfIndex !== null &&
			regularModShelves[activeShelfIndex]
		) {

			regularModShelves[
				activeShelfIndex
			].products =
				JSON.parse(
					JSON.stringify(
						activeShelfOriginalProducts
					)
				);

		}


		/* =============================================
		   CLOSE POPUP
		============================================= */

		if (
			shelfEditor
		) {

			shelfEditor.hidden =
				true;

		}


		activeShelfIndex =
			null;


		activeShelfOriginalProducts =
			[];


		draggedProductIndex =
			null;


		freshShelfCreatedByNext =
			false;


		renderModularVisual();

	};


/* =========================================================
   SHELF EDITOR CLOSE BUTTON
========================================================= */

if (shelfEditorClose) {

	shelfEditorClose.addEventListener(
		'click',
		event => {

			event.preventDefault();
			event.stopPropagation();


			closeShelfEditor();

		}
	);

}


/* =========================================================
   SHELF EDITOR BACKDROP
========================================================= */

if (shelfEditorBackdrop) {

	shelfEditorBackdrop.addEventListener(
		'click',
		event => {

			event.preventDefault();
			event.stopPropagation();


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
		event => {

			event.preventDefault();
			event.stopPropagation();


			if (
				activeShelfIndex === null
			) {

				return;

			}


			markRegularModModified();


			closeShelfEditor(
				true
			);

		}
	);

}


/* =========================================================
   NEXT SHELF
========================================================= */

if (shelfEditorNext) {

	shelfEditorNext.addEventListener(
		'click',
		event => {

			event.preventDefault();
			event.stopPropagation();


			if (
				activeShelfIndex === null
			) {

				return;

			}


			/* =============================================
			   SAVE CURRENT SHELF
			============================================= */

			markRegularModModified();


			const nextShelfIndex =
				activeShelfIndex + 1;


			/* =============================================
			   INSERT FRESH NEXT SHELF
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


			activeShelfOriginalProducts =
				[];


			freshShelfCreatedByNext =
				true;


			markRegularModModified();


			renderModularVisual();


			/* =============================================
			   OPEN FRESH SHELF
			============================================= */

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
		event => {

			event.preventDefault();
			event.stopPropagation();


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
		event => {

			event.preventDefault();
			event.stopPropagation();


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
		event => {

			event.preventDefault();
			event.stopPropagation();


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