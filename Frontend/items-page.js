(function () {
	const API_BASE = 'http://localhost:3000/api/products';

	const form = document.querySelector('#item-form');
	const list = document.querySelector('#items-list');
	const count = document.querySelector('#item-count');
	const message = document.querySelector('#form-message');
	const formTitle = document.querySelector('#form-title');
	const saveButton = document.querySelector('#save-item');
	const newItemButton = document.querySelector('#new-item');

	const locationsPanel = document.querySelector('#locations-panel');
	const locationsHint = document.querySelector('#locations-hint');
	const locationList = document.querySelector('#location-list');
	const locationCount = document.querySelector('#location-count');
	const locationForm = document.querySelector('#location-form');

	let editingUpc = null;
	let editingItem = null;
	let formBaseline = '';

	/* =========================================================
	   API HELPERS
	========================================================= */

	const apiRequest = async (url, options = {}) => {
		const response = await fetch(url, {
			headers: {
				'Content-Type': 'application/json',
				...(options.headers || {})
			},
			...options
		});

		let data = null;

		try {
			data = await response.json();
		} catch {
			data = null;
		}

		if (!response.ok) {
			throw new Error(
				data?.error ||
				data?.message ||
				`Request failed with status ${response.status}`
			);
		}

		return data;
	};

	const getItems = async () => {
		return await apiRequest(API_BASE);
	};

	const getItem = async (upc) => {
		return await apiRequest(
			`${API_BASE}/${encodeURIComponent(upc)}`
		);
	};

	const getLocations = async (upc) => {
		return await apiRequest(
			`${API_BASE}/${encodeURIComponent(upc)}/locations`
		);
	};

	const createItem = async (item) => {
		return await apiRequest(API_BASE, {
			method: 'POST',
			body: JSON.stringify(item)
		});
	};

	const updateItem = async (upc, item) => {
		return await apiRequest(
			`${API_BASE}/${encodeURIComponent(upc)}`,
			{
				method: 'PUT',
				body: JSON.stringify(item)
			}
		);
	};

	const deleteItem = async (upc) => {
		return await apiRequest(
			`${API_BASE}/${encodeURIComponent(upc)}`,
			{
				method: 'DELETE'
			}
		);
	};

	const addLocation = async (upc, location) => {
		return await apiRequest(
			`${API_BASE}/${encodeURIComponent(upc)}/locations`,
			{
				method: 'POST',
				body: JSON.stringify(location)
			}
		);
	};

	const deleteLocation = async (locationId) => {
		return await apiRequest(
			`${API_BASE}/locations/${encodeURIComponent(locationId)}`,
			{
				method: 'DELETE'
			}
		);
	};

	const setPrimaryLocation = async (upc, locationId) => {
		return await apiRequest(
			`${API_BASE}/${encodeURIComponent(upc)}/locations/${encodeURIComponent(locationId)}/primary`,
			{
				method: 'PUT'
			}
		);
	};

	/* =========================================================
	   HELPERS
	========================================================= */

	const valueOrNull = (value) =>
		value === '' ? null : value;

	const numberOrNull = (value) =>
		value === '' ? null : Number(value);

	const readImageFile = (file) =>
		new Promise((resolve, reject) => {
			if (!file) {
				resolve('');
				return;
			}

			const reader = new FileReader();

			reader.onload = () => resolve(reader.result);
			reader.onerror = () => reject(reader.error);

			reader.readAsDataURL(file);
		});

	const escapeHtml = (value) => {
		return String(value ?? '')
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#039;');
	};

	const normaliseItem = (item) => {
		return {
			upc: item.upc,
			itemNumber:
				item.itemNumber ??
				item.item_number ??
				'',

			description:
				item.description ?? '',

			onHand:
				item.onHand ??
				item.on_hand ??
				0,

			price:
				item.price ??
				0,

			caseSize:
				item.caseSize ??
				item.case_size ??
				0,

			maxShelf:
				item.maxShelf ??
				item.max_shelf ??
				0,

			department:
				item.department ??
				'',

			rangeStatus:
				item.rangeStatus ??
				item.range_status ??
				'in-range',

			aisle:
				item.aisle ??
				null,

			aisleSide:
				item.aisleSide ??
				item.aisle_side ??
				null,

			bay:
				item.bay ??
				null,

			image: item.image || {
				url:
					item.imageUrl ??
					item.image_url ??
					'',

				alt:
					item.imageAlt ??
					item.image_alt ??
					item.description ??
					''
			}
		};
	};

	/* =========================================================
	   RENDER ITEMS
	========================================================= */

	const renderItems = async () => {
		try {
			const rawItems = await getItems();

			const items = rawItems.map(normaliseItem);

			count.textContent =
				`${items.length} item${items.length === 1 ? '' : 's'}`;

			list.replaceChildren();

			if (!items.length) {
				list.innerHTML =
					'<p class="empty-state">No items saved yet.</p>';
				return;
			}

			items
				.sort((first, second) =>
					first.description.localeCompare(
						second.description
					)
				)
				.forEach((item) => {

					const row =
						document.createElement('article');

					row.className = 'item-row';

					/* IMAGE */

					const image =
						item.image?.url
							? document.createElement('img')
							: document.createElement('div');

					image.className =
						item.image?.url
							? ''
							: 'image-placeholder';

					if (item.image?.url) {
						image.src = item.image.url;

						image.alt =
							item.image.alt ||
							item.description;

						image.addEventListener(
							'error',
							() => {
								image.removeAttribute('src');
								image.className =
									'image-placeholder';
								image.textContent =
									'No image';
							},
							{ once: true }
						);
					} else {
						image.textContent = 'No image';
					}

					row.appendChild(image);

					/* DETAILS */

					const details =
						document.createElement('div');

					const rangeLabels = {
						'in-range': 'In range',
						'soon-ending':
							'Soon to be ending',
						'ended': 'Ended',
						'soon-in-range':
							'Soon to be in range'
					};

					const locationSummary =
						(
							item.aisle ||
							item.aisleSide ||
							item.bay
						)
							? `${item.aisle || '—'}-${item.aisleSide || '—'}-${item.bay || '—'}`
							: 'No location set';

					details.innerHTML = `
						<h3>${escapeHtml(item.description)}</h3>

						<p>
							UPC ${escapeHtml(item.upc)}
							· Dept ${escapeHtml(item.department || '9999')}
						</p>

						<p>
							${escapeHtml(locationSummary)}
							· Case ${item.caseSize ?? 0}
						</p>

						<p>
							Range:
							${rangeLabels[item.rangeStatus] || 'In range'}
						</p>
					`;

					row.appendChild(details);

					/* ACTIONS */

					const actions =
						document.createElement('div');

					actions.className =
						'item-actions';

					const stock =
						document.createElement('strong');

					stock.textContent =
						`${item.onHand ?? 0} on hand`;

					actions.appendChild(stock);

					const deleteButton =
						document.createElement('button');

					deleteButton.className =
						'delete-item';

					deleteButton.type = 'button';

					deleteButton.textContent =
						'Delete';

					deleteButton.addEventListener(
						'click',
						async (event) => {
							event.stopPropagation();

							if (
								!window.confirm(
									`Delete ${item.description}?`
								)
							) {
								return;
							}

							try {
								await deleteItem(
									item.upc
								);

								if (
									editingUpc ===
									item.upc
								) {
									form.reset();
									resetEditState();
								}

								message.textContent =
									'Item deleted.';

								await renderItems();

							} catch (error) {
								message.textContent =
									error.message;
							}
						}
					);

					actions.appendChild(
						deleteButton
					);

					row.appendChild(actions);

					row.addEventListener(
						'click',
						() => startEdit(item)
					);

					list.appendChild(row);
				});

		} catch (error) {
			console.error(
				'Failed to load items:',
				error
			);

			count.textContent = '0 items';

			list.innerHTML = `
				<p class="empty-state">
					Unable to load items from the database.
				</p>
			`;

			message.textContent =
				error.message;
		}
	};

	/* =========================================================
	   LOCATIONS
	========================================================= */

	const renderLocations = async () => {
		if (!editingUpc) {
			locationsPanel.hidden = true;
			locationsHint.hidden = false;
			return;
		}

		locationsPanel.hidden = false;
		locationsHint.hidden = true;

		try {
			const locations =
				await getLocations(editingUpc);

			locationCount.textContent =
				`${locations.length} location${locations.length === 1 ? '' : 's'}`;

			locationList.replaceChildren();

			if (!locations.length) {
				locationList.innerHTML =
					'<p class="location-empty">No locations set for this item yet.</p>';

				return;
			}

			locations.forEach((location) => {

				const row =
					document.createElement('div');

				row.className =
					`location-row${location.isPrimary || location.is_primary ? ' is-primary' : ''}`;

				const isPrimary =
					location.isPrimary ??
					location.is_primary ??
					false;

				const aisle =
					location.aisle ?? '';

				const aisleSide =
					location.aisleSide ??
					location.aisle_side ??
					'';

				const bay =
					location.bay ?? '';

				const shelf =
					location.shelf ?? '';

				const modularId =
					location.modularId ??
					location.modular_id ??
					'';

				const locationId =
					location.id;

				const codeParts =
					[
						aisle,
						aisleSide,
						bay
					].filter(Boolean);

				const codeText =
					codeParts.length
						? codeParts.join('-')
						: 'No aisle/bay set';

				const metaParts = [];

				if (shelf) {
					metaParts.push(
						`Shelf ${escapeHtml(shelf)}`
					);
				}

				if (modularId) {
					metaParts.push(
						`Modular ${escapeHtml(modularId)}`
					);
				}

				const details =
					document.createElement('div');

				details.className =
					'location-row-details';

				details.innerHTML = `
					<span class="location-row-code">
						${escapeHtml(codeText)}

						${isPrimary
							? '<span class="location-primary-badge">PRIMARY</span>'
							: ''
						}
					</span>

					<span class="location-row-meta">
						${metaParts.length
							? metaParts.join(' · ')
							: 'No shelf/modular set'
						}
					</span>
				`;

				row.appendChild(details);

				const rowActions =
					document.createElement('div');

				rowActions.className =
					'location-row-actions';

				/* MAKE PRIMARY */

				const makePrimaryButton =
					document.createElement('button');

				makePrimaryButton.type =
					'button';

				makePrimaryButton.className =
					'make-primary';

				makePrimaryButton.textContent =
					'Make primary';

				makePrimaryButton.disabled =
					isPrimary;

				makePrimaryButton.addEventListener(
					'click',
					async (event) => {
						event.stopPropagation();

						try {
							await setPrimaryLocation(
								editingUpc,
								locationId
							);

							message.textContent =
								'Primary location updated.';

							await renderLocations();
							await renderItems();

						} catch (error) {
							message.textContent =
								error.message;
						}
					}
				);

				rowActions.appendChild(
					makePrimaryButton
				);

				/* REMOVE */

				const removeButton =
					document.createElement('button');

				removeButton.type =
					'button';

				removeButton.className =
					'remove-location';

				removeButton.textContent =
					'Remove';

				removeButton.addEventListener(
					'click',
					async (event) => {
						event.stopPropagation();

						if (
							!window.confirm(
								'Remove this location?'
							)
						) {
							return;
						}

						try {
							await deleteLocation(
								locationId
							);

							message.textContent =
								'Location removed.';

							await renderLocations();
							await renderItems();

						} catch (error) {
							message.textContent =
								error.message;
						}
					}
				);

				rowActions.appendChild(
					removeButton
				);

				row.appendChild(rowActions);

				locationList.appendChild(row);
			});

		} catch (error) {
			console.error(
				'Failed to load locations:',
				error
			);

			locationCount.textContent =
				'0 locations';

			locationList.innerHTML = `
				<p class="location-empty">
					Unable to load locations.
				</p>
			`;

			message.textContent =
				error.message;
		}
	};

/* =========================================================
   ADD LOCATION
========================================================= */

const updateModularId = () => {

	const aisle =
		locationForm.elements.locAisle.value.trim();

	const aisleSide =
		locationForm.elements.locAisleSide.value.trim();

	const bay =
		locationForm.elements.locBay.value.trim();

	const modularIdField =
		locationForm.elements.locModularId;


	/* =====================================================
	   REQUIRE AISLE + SIDE + BAY
	===================================================== */

	if (!aisle || !aisleSide || !bay) {

		modularIdField.value = '';

		return;

	}


	/* =====================================================
	   NORMALISE AISLE

	   16    → 16
	   FF16  → 16
	   FF-16 → 16
	===================================================== */

	const upperAisle =
		aisle.toUpperCase();

	let formattedAisle =
		upperAisle;


	if (upperAisle.startsWith('FF-')) {

		formattedAisle =
			aisle.substring(3);

	} else if (upperAisle.startsWith('FF')) {

		formattedAisle =
			aisle
				.substring(2)
				.replace(/^-/, '');

	}


	/* =====================================================
	   GENERATE MODULAR ID

	   FF-16-R-20

	   Shelf is NOT included.
	===================================================== */

	modularIdField.value =
		`FF-${formattedAisle}-${aisleSide.toUpperCase()}-${bay}`;

};



/* =========================================================
   AUTO-UPDATE MODULAR ID
========================================================= */

[
	'locAisle',
	'locAisleSide',
	'locBay'
].forEach((fieldName) => {

	locationForm.elements[fieldName]
		.addEventListener(
			'input',
			updateModularId
		);

});



/* =========================================================
   SUBMIT LOCATION
========================================================= */

locationForm.addEventListener(
	'submit',
	async (event) => {

		event.preventDefault();


		if (!editingUpc) {

			return;

		}


		/* =====================================================
		   GET VALUES
		===================================================== */

		const aisle =
			locationForm.elements.locAisle.value.trim();

		const aisleSide =
			locationForm.elements.locAisleSide.value.trim();

		const bay =
			locationForm.elements.locBay.value.trim();

		const shelf =
			locationForm.elements.locShelf.value.trim();


		/* =====================================================
		   REQUIRE AISLE
		===================================================== */

		if (!aisle) {

			message.textContent =
				'Please enter an aisle number.';

			locationForm.elements.locAisle.focus();

			return;

		}


		/* =====================================================
		   REQUIRE AISLE SIDE
		===================================================== */

		if (!aisleSide) {

			message.textContent =
				'Please enter an aisle side.';

			locationForm.elements.locAisleSide.focus();

			return;

		}


		/* =====================================================
		   REQUIRE BAY
		===================================================== */

		if (!bay) {

			message.textContent =
				'Please enter a bay number.';

			locationForm.elements.locBay.focus();

			return;

		}


		/* =====================================================
		   GENERATE FINAL MODULAR ID
		===================================================== */

		updateModularId();


		const modularId =
			locationForm.elements.locModularId.value.trim();


		/* =====================================================
		   FINAL SAFETY CHECK
		===================================================== */

		if (!modularId) {

			message.textContent =
				'Unable to generate Modular ID.';

			return;

		}


		try {

			await addLocation(
				editingUpc,
				{
					aisle: aisle,

					aisleSide:
						aisleSide.toUpperCase(),

					bay: bay,

					shelf: shelf,

					modularId: modularId,

					isPrimary:
						locationForm.elements
							.locIsPrimary
							.checked
				}
			);


			locationForm.reset();


			/* Clear generated Modular ID after reset */

			locationForm.elements
				.locModularId.value = '';


			message.textContent =
				'Location added.';


			await renderLocations();

			await renderItems();


		} catch (error) {

			message.textContent =
				error.message;

		}

	}
);
	/* =========================================================
	   FORM HELPERS
	========================================================= */

	const setField = (name, value) => {
		if (form.elements[name]) {
			form.elements[name].value =
				value ?? '';
		}
	};

	const formSnapshot = () =>
		Array.from(form.elements)
			.filter(
				(element) =>
					element.name
			)
			.map((element) => {

				if (element.type === 'file') {
					const file =
						element.files[0];

					return `${element.name}=${
						file
							? `${file.name}:${file.size}:${file.lastModified}`
							: ''
					}`;
				}

				return `${element.name}=${element.value}`;
			})
			.join('&');

	const updateSaveState = () => {
		saveButton.disabled =
			formSnapshot() === formBaseline;
	};

	const resetEditState = () => {
		editingUpc = null;
		editingItem = null;

		form.classList.remove(
			'editing'
		);

		formTitle.textContent =
			'New item';

		saveButton.textContent =
			'Save item';

		form.elements.upc.readOnly =
			false;

		formBaseline =
			formSnapshot();

		updateSaveState();

		renderLocations();
	};

	/* =========================================================
	   START EDIT
	========================================================= */

	const startEdit = async (rawItem) => {

		const item =
			normaliseItem(rawItem);

		editingUpc =
			item.upc;

		editingItem =
			item;

		form.classList.add(
			'editing'
		);

		formTitle.textContent =
			'Edit item';

		saveButton.textContent =
			'Update item';

		form.elements.upc.readOnly =
			true;

		[
			'upc',
			'itemNumber',
			'description',
			'price',
			'onHand',
			'caseSize',
			'maxShelf',
			'department',
			'rangeStatus'
		].forEach((name) => {
			setField(
				name,
				item[name]
			);
		});

		setField(
			'imageUrl',
			item.image?.url?.startsWith('data:')
				? ''
				: item.image?.url
		);

		formBaseline =
			formSnapshot();

		updateSaveState();

		message.textContent =
			`Editing ${item.description}.`;

		form.scrollIntoView({
			behavior: 'smooth',
			block: 'start'
		});

		await renderLocations();
	};

	/* =========================================================
	   RESET / NEW ITEM
	========================================================= */

	form.addEventListener(
		'reset',
		() => {
			setTimeout(
				resetEditState
			);
		}
	);

	form.addEventListener(
		'input',
		updateSaveState
	);

	form.addEventListener(
		'change',
		updateSaveState
	);

	newItemButton.addEventListener(
		'click',
		() => {
			form.reset();

			message.textContent =
				'Ready for a new item.';
		}
	);

	/* =========================================================
	   SAVE / UPDATE ITEM
	========================================================= */

	form.addEventListener(
		'submit',
		async (event) => {
			event.preventDefault();

			const data =
				new FormData(form);

			const imageFile =
				data.get('imageFile');

			const uploadedImage =
				await readImageFile(
					imageFile instanceof File &&
					imageFile.size
						? imageFile
						: null
				);

			const item = {
				upc:
					data.get('upc').trim(),

				itemNumber:
					valueOrNull(
						data
							.get('itemNumber')
							.trim()
					),

				description:
					data
						.get('description')
						.trim(),

				onHand:
					numberOrNull(
						data.get('onHand')
					) ?? 0,

				caseSize:
					numberOrNull(
						data.get('caseSize')
					) ?? 0,

				maxShelf:
					numberOrNull(
						data.get('maxShelf')
					) ?? 0,

				department:
					data
						.get('department')
						.trim() || '9999',

				rangeStatus:
					data.get('rangeStatus') ||
					'in-range',

				price:
					numberOrNull(
						data.get('price')
					) ?? 1,

				imageUrl:
					uploadedImage ||
					data
						.get('imageUrl')
						.trim() ||
					editingItem?.image?.url ||
					'',

				imageAlt:
					data
						.get('description')
						.trim()
			};

			try {
				const wasNewItem =
					!editingUpc;

				if (wasNewItem) {
					await createItem(
						item
					);

					message.textContent =
						'Item saved. Add its locations below.';

				} else {
					await updateItem(
						editingUpc,
						item
					);

					message.textContent =
						'Item updated.';
				}

				const savedItem =
					await getItem(
						item.upc
					);

				await startEdit(
					savedItem
				);

				await renderItems();

			} catch (error) {
				console.error(
					'Failed to save item:',
					error
				);

				message.textContent =
					error.message;
			}
		}
	);

	/* =========================================================
	   INITIAL LOAD
	========================================================= */

	const initialise = async () => {
		try {
			await renderItems();
			await renderLocations();
		} catch (error) {
			console.error(
				'Failed to initialise items page:',
				error
			);

			message.textContent =
				error.message;
		}
	};

	initialise();
})();