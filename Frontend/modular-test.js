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
   CLEAR SELECTED MODULAR
========================================================= */

const clearSelectedModular =
	() => {

		localStorage.removeItem(
			'selectedModularId'
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
   URL PARAMETERS
========================================================= */

const modularTestParams =
	new URLSearchParams(
		window.location.search
	);


/* =========================================================
   ASSIGN CONTEXT
========================================================= */

const assignData =
	modularTestParams.get(
		'assign'
	);


let assignContext =
	null;


if (
	assignData
) {

	try {

		assignContext =
			JSON.parse(
				assignData
			);

	}
	catch (
		error
	) {

		console.error(
			'Failed to load assign context:',
			error
		);

	}

}


/* =========================================================
   UPDATE CONTEXT
========================================================= */

const updateData =
	modularTestParams.get(
		'update'
	);


let updateContext =
	null;


if (
	updateData
) {

	try {

		updateContext =
			JSON.parse(
				updateData
			);

	}
	catch (
		error
	) {

		console.error(
			'Failed to load update context:',
			error
		);

	}

}


/* =========================================================
   ASSIGN VALUES
========================================================= */

const assignCurrentBayIds =
	assignContext?.currentBayIds ??
	[];


const assignTargetBayId =
	assignContext?.targetBayId ??
	null;


const assignModularTag =
	assignContext?.modularTag ??
	null;


const assignAssignments =
	assignContext?.assignments ??
	[];


/* =========================================================
   UPDATE VALUES
========================================================= */

const updateAssignmentIndex =
	Number.isInteger(
		updateContext?.assignmentIndex
	)
		? updateContext.assignmentIndex
		: null;


const updateAssignment =
	updateContext?.assignment ??
	null;


const updateReturnUrl =
	updateContext?.returnUrl ??
	null;


/* =========================================================
   MODULAR TAG FOR UPDATE
========================================================= */

const updateModularTag =
	updateAssignment?.modularTag ??
	null;


/* =========================================================
   UPDATE STATE
========================================================= */

const updateIsAssignFinished =
	updateAssignment?.assignFinished === true;


const updateIsOverwriteFinished =
	updateAssignment?.overwriteFinished === true;


const updateIsReturned =
	updateAssignment?.updateReturned === true;


/* =========================================================
   MODE
========================================================= */

const isAssignMode =
	Boolean(
		assignContext
	);


const isUpdateMode =
	Boolean(
		updateContext
	);


/* =========================================================
   ATTACH MODULAR BUTTON STATE
========================================================= */

let attachModularButtonsHidden =
	false;


/* =========================================================
   GET ASSIGN MODULAR PRODUCTS
========================================================= */

const getAssignModularProducts =
	async () => {

		if (
			!assignModularTag
		) {

			return [];

		}


		return apiRequest(
			`${API_BASE}/modular/${encodeURIComponent(assignModularTag)}`
		);

	};


/* =========================================================
   GET UPDATE MODULAR PRODUCTS
========================================================= */

const getUpdateModularProducts =
	async () => {

		if (
			!updateModularTag
		) {

			return [];

		}


		return apiRequest(
			`${API_BASE}/modular/${encodeURIComponent(updateModularTag)}`
		);

	};

const getOverwriteModularProducts =
	async () => {

		if (
			!updateAssignment?.bayId
		) {
			return [];
		}

		return apiRequest(
			`${API_BASE}/modular-bay/${
				encodeURIComponent(
					updateAssignment.bayId
				)
			}/items`
		);

	};
/* =========================================================
   PRODUCT SEARCH
========================================================= */

const searchProducts =
	async (
		query
	) => {

		const searchQuery =
			String(
				query ?? ''
			).trim();


		if (
			!searchQuery
		) {

			return [];

		}


		/*
			This uses the existing backend
			route you already have for modular
			bay product searching.
		*/

		return apiRequest(
			`${API_ORIGIN}/api/products/admin/modular-activity/bay-items/search?q=${encodeURIComponent(searchQuery)}`
		);

	};


/* =========================================================
   DEBUG
========================================================= */

console.log(
	'Selected modular:',
	selectedModularId
);


console.log(
	'Assign context:',
	assignContext
);


console.log(
	'Assign current bay IDs:',
	assignCurrentBayIds
);


console.log(
	'Assign target bay:',
	assignTargetBayId
);


console.log(
	'Assign modular tag:',
	assignModularTag
);


console.log(
	'Assign assignments:',
	assignAssignments
);


console.log(
	'Assign mode:',
	isAssignMode
);


console.log(
	'Update context:',
	updateContext
);


console.log(
	'Update assignment index:',
	updateAssignmentIndex
);


console.log(
	'Update assignment:',
	updateAssignment
);


console.log(
	'Update modular tag:',
	updateModularTag
);


console.log(
	'Update assign finished:',
	updateIsAssignFinished
);


console.log(
	'Update overwrite finished:',
	updateIsOverwriteFinished
);


console.log(
	'Update returned:',
	updateIsReturned
);


console.log(
	'Update mode:',
	isUpdateMode
);


/* =========================================================
   REGULAR MOD NAME
========================================================= */

const regularModName =
	document.querySelector(
		'#regular-mod-name'
	);


if (
	regularModName
) {

	if (
		isAssignMode &&
		assignModularTag
	) {

		regularModName.textContent =
			`UPDATING (${assignModularTag})`;

	}
	else if (
		isUpdateMode &&
		updateModularTag
	) {

		regularModName.textContent =
			`UPDATING (${updateModularTag})`;

	}
	else if (
		selectedModularId
	) {

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
   HIDE CLEAR BUTTON IN NON-NORMAL MODES
========================================================= */

if (
	(
		isAssignMode ||
		isUpdateMode
	) &&
	regularModClear
) {

	regularModClear.hidden =
		true;

}


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


			if (
				!selectedDevice
			) {

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

		if (
			!clearModal
		) {

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

if (
	clearModalCancel
) {

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

if (
	clearModalBackdrop
) {

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

if (
	clearModalConfirm
) {

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

		if (
			!regularModUpdate
		) {

			return;

		}


		if (
			regularModModified
		) {

			regularModUpdate.disabled =
				false;

		}
		else {

			regularModUpdate.disabled =
				true;

		}

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
   BUILD PRODUCTS FROM CURRENT SHELVES
========================================================= */

const buildCurrentModularProducts =
	() => {

		const products = [];


		regularModShelves.forEach(
			shelfData => {

				const shelfNumber =
					Number(
						shelfData.shelf
					);


				if (
					!Array.isArray(
						shelfData.products
					)
				) {

					return;

				}


				shelfData.products.forEach(
					(
						product,
						productIndex
					) => {

						const itemId =
							product.item_id ??
							product.itemId ??
							null;


						const upc =
							product.upc ??
							null;


						const image =
							product.image_url ??
							product.image ??
							product.imageUrl ??
							null;


						products.push({

							itemId:
								itemId,

							upc:
								upc,

							image:
								image,

							image_url:
								product.image_url ??
								null,

							image_alt:
								product.image_alt ??
								product.image?.alt ??
								null,

							description:
								product.description ??
								null,

							shelf:
								shelfNumber,

							order:
								productIndex + 1

						});

					}
				);

			}
		);


		return products;

	};


/* =========================================================
   BUILD SHELVES FROM PRODUCTS
========================================================= */

const buildShelvesFromProducts =
	(
		products
	) => {

		if (
			!Array.isArray(products) ||
			products.length === 0
		) {

			return [];

		}


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
					Number.isNaN(shelf)
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


		const result =
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
										productA.order ??
										productA.shelf_order
									);


								const orderB =
									Number(
										productB.order ??
										productB.shelf_order
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

							shelf:
								shelf,

							products:
								shelfProducts

						};

					}
				);


		return result;

	};


/* =========================================================
   FINISH REGULAR MODULAR
========================================================= */

if (
	regularModUpdate
) {

	regularModUpdate.addEventListener(
		'click',
		async event => {

			event.preventDefault();
			event.stopPropagation();


			/* =====================================================
			   ASSIGN MODE
			===================================================== */

			if (
				isAssignMode
			) {

				const assignment =
					assignAssignments.find(
						item =>
							item.modularTag ===
							assignModularTag
					);


				if (
					!assignment
				) {

					console.error(
						'Could not find assignment for modular tag:',
						assignModularTag,
						assignAssignments
					);


					alert(
						'Could not find the modular assignment.'
					);


					return;

				}


				const products =
					buildCurrentModularProducts();


				assignment.bayId =
					assignTargetBayId;


				assignment.products =
					products;


				assignment.assignFinished =
					true;


				assignContext.assignFinished =
					true;


				console.log(
					'Updated assign context:',
					assignContext
				);


				const updatedAssignData =
					encodeURIComponent(
						JSON.stringify(
							assignContext
						)
					);


				console.log(
					'Updated assignData:',
					updatedAssignData
				);


				/*
					IMPORTANT:

					Use the stored return URL but
					remove any previous assignResult
					before adding the new one.

					This prevents the recursive URL
					problem that caused the 431 error.
				*/

				const returnUrl =
					new URL(
						assignContext.returnUrl,
						window.location.href
					);


				returnUrl.searchParams.delete(
					'assignResult'
				);


				returnUrl.searchParams.set(
					'assignResult',
					JSON.stringify(
						assignContext
					)
				);


				window.location.replace(
					returnUrl.toString()
				);


				return;

			}


			/* =====================================================
			   UPDATE MODE
			===================================================== */

			if (
				isUpdateMode
			) {

				if (
					!updateAssignment
				) {

					console.error(
						'Update mode has no assignment.'
					);


					alert(
						'Could not find the modular assignment.'
					);


					return;

				}


				/*
					The current editor contents are now
					the information that must be returned
					to Modular Activity.
				*/

				updateAssignment.products =
					buildCurrentModularProducts();


				/*
					This marks that the Update Modular
					page has been visited and its current
					state has been returned.

					We deliberately do NOT set
					assignFinished or overwriteFinished.
				*/

				updateAssignment.updateReturned =
					true;


				updateContext.assignment =
					updateAssignment;


				updateContext.updateReturned =
					true;


				console.log(
					'Updated update context:',
					updateContext
				);


				const updatedUpdateData =
					encodeURIComponent(
						JSON.stringify(
							updateContext
						)
					);


				if (
					!updateReturnUrl
				) {

					console.warn(
						'Update mode has no returnUrl.'
					);


					return;

				}


				const returnUrl =
					new URL(
						updateReturnUrl,
						window.location.href
					);


				returnUrl.searchParams.delete(
					'updateResult'
				);


				returnUrl.searchParams.set(
					'updateResult',
					JSON.stringify(
						updateContext
					)
				);


				window.location.replace(
					returnUrl.toString()
				);


				return;

			}


			/* =====================================================
			   NORMAL MODE
			===================================================== */

			if (
				!selectedModularId ||
				!regularModModified
			) {

				return;

			}


			try {

				regularModUpdate.disabled =
					true;


				const response =
					await apiRequest(
						`${API_BASE}/modular/${encodeURIComponent(selectedModularId)}`,
						{
							method:
								'PUT',

							headers: {
								'Content-Type':
									'application/json'
							},

							body:
								JSON.stringify({
									shelves:
										regularModShelves
								})
						}
					);


				console.log(
					'Modular saved:',
					response
				);


				regularModOriginalShelves =
					JSON.parse(
						JSON.stringify(
							regularModShelves
						)
					);


				regularModModified =
					false;


				updateRegularModButton();


				clearSelectedModular();


				alert(
					'Modular updated successfully.'
				);

			}
			catch (error) {

				console.error(
					'Failed to save modular:',
					error
				);


				updateRegularModButton();


				alert(
					'Unable to update modular.'
				);

			}

		}
	);

}


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

		clearSelectedModular();


		/* =====================================================
		   ASSIGN MODE
		===================================================== */

		if (
			isAssignMode
		) {

			const returnUrl =
				assignContext.returnUrl;


			if (
				returnUrl
			) {

				const url =
					new URL(
						returnUrl,
						window.location.href
					);


				url.searchParams.delete(
					'assignResult'
				);


				url.searchParams.set(
					'assignResult',
					JSON.stringify(
						assignContext
					)
				);


				window.location.replace(
					url.toString()
				);


				return;

			}


			console.warn(
				'Assign mode has no returnUrl.'
			);

		}


		/* =====================================================
		   UPDATE MODE
		===================================================== */

		if (
			isUpdateMode
		) {

			if (
				!updateReturnUrl
			) {

				console.warn(
					'Update mode has no returnUrl.'
				);


				return;

			}


			/*
				Back does not mark the update as
				finished.

				It simply passes the current
				in-memory modular information
				back to Modular Activity.

				This is what allows the next
				Update Modular click to reuse
				the information instead of
				querying the DB again.
			*/

			updateAssignment.products =
				buildCurrentModularProducts();


			updateAssignment.updateReturned =
				true;


			updateContext.assignment =
				updateAssignment;


			updateContext.updateReturned =
				true;


			const url =
				new URL(
					updateReturnUrl,
					window.location.href
				);


			url.searchParams.delete(
				'updateResult'
			);


			url.searchParams.set(
				'updateResult',
				JSON.stringify(
					updateContext
				)
			);


			window.location.replace(
				url.toString()
			);


			return;

		}


		/* =====================================================
		   NORMAL MODE
		===================================================== */

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

if (
	regularModBack
) {

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

if (
	regularModCancel
) {

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


		attachModularButtonsHidden =
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

if (
	regularModClear
) {

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

if (
	regularModReset
) {

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


				if (
					!upc
				) {

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


		if (
			!shelf
		) {

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


		if (
			shelfEditorUpcs
		) {

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


		if (
			!shelf
		) {

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
								await searchProducts(
									barcode
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

if (
	shelfEditorClose
) {

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

if (
	shelfEditorBackdrop
) {

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

if (
	shelfEditorFinish
) {

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

if (
	shelfEditorNext
) {

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


			markRegularModModified();


			const nextShelfIndex =
				activeShelfIndex + 1;


			regularModShelves.splice(
				nextShelfIndex,
				0,
				{
					shelf: 0,
					products: []
				}
			);


			renumberRegularModShelves();


			activeShelfIndex =
				nextShelfIndex;


			activeShelfOriginalProducts =
				[];


			freshShelfCreatedByNext =
				true;


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

if (
	shelfEditorEnterUpc
) {

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


			searchProducts(
				upc
			)
				.then(
					results => {

						if (
							!Array.isArray(results) ||
							results.length === 0
						) {

							alert(
								`No product found for barcode ${upc}.`
							);

							return;

						}


						const product =
							results[0];


						regularModShelves[
							activeShelfIndex
						].products.push(
							product
						);


						markRegularModModified();


						renderShelfEditorProducts();


						renderModularVisual();

					}
				)
				.catch(
					error => {

						console.error(
							'Failed to search UPC:',
							error
						);


						alert(
							'Unable to find the product.'
						);

					}
				);

		}
	);

}


/* =========================================================
   CANNOT SCAN
========================================================= */

if (
	shelfEditorCannotScan
) {

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

if (
	shelfEditorUnstructured
) {

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
   ATTACH MODULAR
========================================================= */

const attachModular =
	async (
		insertIndex
	) => {

		if (
			!isAssignMode ||
			!assignTargetBayId
		) {

			return;

		}


		try {

			const products =
				await apiRequest(
					`${API_BASE}/modular-bay/${encodeURIComponent(assignTargetBayId)}/items`
				);


			if (
				!Array.isArray(products) ||
				products.length === 0
			) {

				alert(
					'No modular items were found for this bay.'
				);

				return;

			}


			const newShelves =
				buildShelvesFromProducts(
					products
				);


			regularModShelves.splice(
				insertIndex,
				0,
				...newShelves
			);


			renumberRegularModShelves();


			markRegularModModified();


			attachModularButtonsHidden =
				true;


			renderModularVisual();

		}
		catch (error) {

			console.error(
				'Failed to attach modular:',
				error
			);


			alert(
				'Unable to attach the modular.'
			);

		}

	};


/* =========================================================
   RENDER REGULAR MOD VISUAL
========================================================= */

const renderModularVisual =
	() => {

		if (
			!modularVisual
		) {

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

			if (
				isAssignMode &&
				!attachModularButtonsHidden
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
					'Attach Modular'
				);


				plusButton.innerHTML =
					'<span>+</span><span>Attach Modular</span>';


				plusButton.addEventListener(
					'click',
					async event => {

						event.stopPropagation();


						await attachModular(
							0
						);

					}
				);


				modularVisual.appendChild(
					plusButton
				);

			}
			else if (
				!isAssignMode &&
				!isUpdateMode
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

			}


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

				if (
					!isAssignMode ||
					!attachModularButtonsHidden
				) {

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
						isAssignMode
							? 'Attach Modular Above'
							: `Add shelf above Shelf ${shelfData.shelf}`
					);


					plusAbove.innerHTML =
						isAssignMode
							? '<span>+</span><span>Attach Modular</span>'
							: '<span>+</span>';


					plusAbove.addEventListener(
						'click',
						async event => {

							event.stopPropagation();


							if (
								isAssignMode
							) {

								await attachModular(
									shelfIndex
								);

								return;

							}


							insertRegularModShelf(
								shelfIndex
							);

						}
					);


					modularVisual.appendChild(
						plusAbove
					);

				}


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

				let removeButton = null;

				if (
					!isAssignMode
				) {

					removeButton =
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

				}


				/* =============================================
				BUILD HEADER
				============================================= */

				shelfHeader.appendChild(
					shelfHeaderLeft
				);

				if (
					removeButton
				) {

					shelfHeader.appendChild(
						removeButton
					);

				}


				/* =============================================
				   PRODUCT AREA
				============================================= */

				const productsContainer =
					document.createElement(
						'div'
					);


				productsContainer.className =
					'regular-mod-products';


				if (
					!isAssignMode
				) {

					productsContainer.addEventListener(
						'click',
						() => {

							openShelfEditor(
								shelfIndex
							);

						}
					);

				}


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
					regularModShelves.length - 1 &&
					(
						!isAssignMode ||
						!attachModularButtonsHidden
					)
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
						isAssignMode
							? 'Attach Modular Below'
							: 'Add shelf below'
					);


					plusBelow.innerHTML =
						isAssignMode
							? '<span>+</span><span>Attach Modular</span>'
							: '<span>+</span>';


					plusBelow.addEventListener(
						'click',
						async event => {

							event.stopPropagation();


							if (
								isAssignMode
							) {

								await attachModular(
									shelfIndex + 1
								);

								return;

							}


							insertRegularModShelf(
								shelfIndex + 1
							);

						}
					);


					modularVisual.appendChild(
						plusBelow
					);

				}

			}
		);


		if (
			window.lucide
		) {

			lucide.createIcons();

		}


		updateRegularModButton();

	};


/* =========================================================
   LOAD PRODUCTS INTO MODULAR EDITOR
========================================================= */

const loadProductsIntoRegularMod =
	(
		products
	) => {

		regularModShelves =
			buildShelvesFromProducts(
				products
			);


		renumberRegularModShelves();


		regularModOriginalShelves =
			JSON.parse(
				JSON.stringify(
					regularModShelves
				)
			);


		regularModModified =
			false;


		attachModularButtonsHidden =
			false;

		console.log(
			'PRODUCTS BEFORE UPDATE RENDER:',
			regularModShelves
		);
		renderModularVisual();

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


			if (
				!Array.isArray(products) ||
				products.length === 0
			) {

				regularModShelves =
					[];


				regularModOriginalShelves =
					[];


				regularModModified =
					false;


				renderModularVisual();


				return;

			}


			loadProductsIntoRegularMod(
				products
			);

		}
		catch (error) {

			console.error(
				'Failed to load modular:',
				error
			);


			if (
				modularVisual
			) {

				modularVisual.innerHTML = `

					<div class="regular-mod-empty">

						Unable to load modular.

					</div>

				`;

			}

		}

	};


/* =========================================================
   LOAD ASSIGN MODULAR
========================================================= */

const loadAssignModular =
	async () => {

		try {

			/*
				If Assign has already returned products
				from a previous visit, use those
				directly.

				Otherwise load the original modular
				from the database.
			*/

			const assignment =
				assignAssignments.find(
					item =>
						item.modularTag ===
						assignModularTag
				);


			if (
				assignment &&
				assignment.assignFinished === true &&
				Array.isArray(
					assignment.products
				)
			) {

				console.log(
					'Loading Assign products from returned assignment.'
				);


				loadProductsIntoRegularMod(
					assignment.products
				);


				attachModularButtonsHidden =
					false;


				return;

			}


			const products =
				await getAssignModularProducts();


			if (
				!Array.isArray(products) ||
				products.length === 0
			) {

				regularModShelves =
					[];


				regularModOriginalShelves =
					[];


				regularModModified =
					false;


				attachModularButtonsHidden =
					false;


				renderModularVisual();


				return;

			}


			loadProductsIntoRegularMod(
				products
			);


			attachModularButtonsHidden =
				false;


			renderModularVisual();

		}
		catch (error) {

			console.error(
				'Failed to load assign modular:',
				error
			);


			if (
				modularVisual
			) {

				modularVisual.innerHTML = `

					<div class="regular-mod-empty">

						Unable to load modular.

					</div>

				`;

			}

		}

	};


/* =========================================================
   LOAD UPDATE MODULAR
========================================================= */

const loadUpdateModular =
	async () => {

		try {

			if (
				!updateAssignment
			) {

				throw new Error(
					'Update context does not contain an assignment.'
				);

			}


			/* =================================================
			STATE 1
			RETURNED FROM UPDATE
			================================================= */

			if (
				updateIsReturned &&
				Array.isArray(
					updateAssignment.products
				)
			) {

				console.log(
					'Update Modular: loading products returned from previous Update Modular visit.'
				);


				loadProductsIntoRegularMod(
					updateAssignment.products
				);


				return;

			}


			/* =================================================
			STATE 2
			OVERWRITE FINISHED
			================================================= */

			if (
				updateIsOverwriteFinished
			) {

				console.log(
					'Update Modular: overwrite finished, loading modular_items from bay.'
				);


				const products =
					await getOverwriteModularProducts();


				loadProductsIntoRegularMod(
					products
				);


				return;

			}


			/* =================================================
			STATE 3
			ASSIGN FINISHED
			================================================= */

			if (
				updateIsAssignFinished &&
				Array.isArray(
					updateAssignment.products
				)
			) {

				console.log(
					'Update Modular: loading products from Assign.'
				);


				loadProductsIntoRegularMod(
					updateAssignment.products
				);


				return;

			}

			/* =================================================
			STATE 4
			NORMAL UPDATE
			================================================= */

			if (
				!updateIsOverwriteFinished &&
				!updateIsAssignFinished
			) {

				console.log(
					'Update Modular: no returned state, loading modular_items from bay.'
				);


				const products =
					await getOverwriteModularProducts();


				loadProductsIntoRegularMod(
					products
				);


				return;

			}

			/* =================================================
			   FALLBACK
			   INITIAL UPDATE
			================================================= */

			console.log(
				'Update Modular: no returned state, loading from database.'
			);


			const products =
				await getUpdateModularProducts();


			loadProductsIntoRegularMod(
				products
			);

		}
		catch (error) {

			console.error(
				'Failed to load update modular:',
				error
			);


			if (
				modularVisual
			) {

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

if (
	isAssignMode
) {

	loadAssignModular();

}
else if (
	isUpdateMode
) {

	loadUpdateModular();

}
else if (
	selectedModularId
) {

	loadRegularMod(
		selectedModularId
	);

}
else {

	regularModShelves =
		[];


	regularModOriginalShelves =
		[];


	renderModularVisual();

}