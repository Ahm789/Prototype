/* =========================================================
   MODULAR ACTIVITY ADMIN
========================================================= */

(function () {


	/* =========================================================
	   API
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
		`${API_ORIGIN}/api/products/admin/modular-activity`;


	/* =========================================================
	   DOM
	========================================================= */

	const form =
		document.getElementById(
			'modular-activity-form'
		);


	const formTitle =
		document.getElementById(
			'modular-activity-form-title'
		);


	const modularNameInput =
		document.getElementById(
			'modular-name'
		);


	const departmentNumberInput =
		document.getElementById(
			'modular-department-number'
		);


	const planogramNumberInput =
		document.getElementById(
			'modular-planogram-number'
		);


	const dueDateInput =
		document.getElementById(
			'modular-due-date'
		);


	const saveButton =
		document.getElementById(
			'save-modular-activity'
		);


	const newActivityButton =
		document.getElementById(
			'new-modular-activity'
		);


	const formMessage =
		document.getElementById(
			'modular-activity-form-message'
		);


	const activityList =
		document.getElementById(
			'modular-activity-list'
		);


	const activityCount =
		document.getElementById(
			'modular-activity-count'
		);


		/* =========================================================
	   MODULAR BAYS DOM
	========================================================= */

	const baysPanel =
		document.getElementById(
			'modular-bays-panel'
		);


	const baysHint =
		document.getElementById(
			'modular-bays-hint'
		);


	const bayList =
		document.getElementById(
			'modular-bay-list'
		);


	const bayCount =
		document.getElementById(
			'modular-bay-count'
		);


	const bayForm =
		document.getElementById(
			'modular-bay-form'
		);


	const bayNumberInput =
		document.getElementById(
			'modular-bay-number'
		);


	const bayModularIdInput =
		document.getElementById(
			'modular-bay-modular-id'
		);


	const bayStatusInput =
		document.getElementById(
			'modular-bay-status'
		);


    const addBayButton =
        document.getElementById(
            'add-modular-bay'
        );


	const updateBayButton =
		document.getElementById(
			'update-modular-bay'
		);


	const clearBayButton =
		document.getElementById(
			'clear-modular-bay'
		);

	/* =========================================================
	   STATE
	========================================================= */

	let editingId = null;

	let activities = [];

	let editingBayId = null;

	let selectedPlanogramNumber = null;


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
					{
						...options,

						headers: {
							'Content-Type':
								'application/json',

							...(options.headers || {})
						}
					}
				);


			let data = null;


			try {

				data =
					await response.json();

			} catch {

				data = null;

			}


			if (
				!response.ok
			) {

				throw new Error(
					data?.error ||
					`Request failed with status ${response.status}.`
				);

			}


			return data;

		};


	/* =========================================================
	   MESSAGE
	========================================================= */

	const showMessage =
		(
			message,
			isError = false
		) => {

			formMessage.textContent =
				message || '';


			formMessage.classList.toggle(
				'error',
				isError
			);

		};


	/* =========================================================
	   FORMAT DATE
	========================================================= */

	const formatDate =
		(dateString) => {

			if (
				!dateString
			) {

				return '';

			}


			const parts =
				String(
					dateString
				).split('-');


			if (
				parts.length !== 3
			) {

				return dateString;

			}


			return `${parts[2]}/${parts[1]}/${parts[0]}`;

		};


	/* =========================================================
	   ESCAPE HTML
	========================================================= */

	const escapeHtml =
		(value) => {

			return String(
				value ?? ''
			)
				.replace(
					/&/g,
					'&amp;'
				)
				.replace(
					/</g,
					'&lt;'
				)
				.replace(
					/>/g,
					'&gt;'
				)
				.replace(
					/"/g,
					'&quot;'
				)
				.replace(
					/'/g,
					'&#039;'
				);

		};


	/* =========================================================
	   RESET BAYS
	========================================================= */

	const resetBays =
		() => {

			baysPanel.hidden =
				true;


			baysHint.hidden =
				false;


			bayList.replaceChildren();


			bayCount.textContent =
				'0 bays';


			editingBayId =
				null;


			selectedPlanogramNumber =
				null;


			if (
				bayForm
			) {

				bayForm.reset();

			}


			if (
				bayModularIdInput
			) {

				bayModularIdInput.value =
					'';

			}


			if (
				bayStatusInput
			) {

				bayStatusInput.value =
					'Due to land';

			}


			if (
				updateBayButton
			) {

				updateBayButton.disabled =
					true;

			}

		};


	/* =========================================================
	   CLEAR BAY FORM
	========================================================= */

	const clearBayForm =
		() => {

			editingBayId =
				null;


			bayForm.reset();


			bayNumberInput.value =
				'';


			bayModularIdInput.value =
				'';


			bayStatusInput.value =
				'Due to land';


			if (
				updateBayButton
			) {

				updateBayButton.disabled =
					true;

			}


			bayList
				.querySelectorAll(
					'.modular-bay-row.editing'
				)
				.forEach(
					row => {

						row.classList.remove(
							'editing'
						);

					}
				);

		};


	/* =========================================================
	   START BAY EDIT
	========================================================= */

	const startBayEdit =
		(bay) => {

			editingBayId =
				Number(
					bay.id
				);


			bayNumberInput.value =
				bay.bayNumber ??
				'';


			bayModularIdInput.value =
				bay.modularId ??
				'';


			bayStatusInput.value =
				bay.status ||
				'Due to land';


			if (
				updateBayButton
			) {

				updateBayButton.disabled =
					false;

			}


			bayList
				.querySelectorAll(
					'.modular-bay-row.editing'
				)
				.forEach(
					row => {

						row.classList.remove(
							'editing'
						);

					}
				);


			const selectedRow =
				bayList.querySelector(
					`.modular-bay-row[data-id="${bay.id}"]`
				);


			if (
				selectedRow
			) {

				selectedRow.classList.add(
					'editing'
				);

			}


			bayForm.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest'
			});

		};
	/* =========================================================
	   LOAD MODULAR BAYS
	========================================================= */

	const loadBays =
		async (
			planogramNumber
		) => {

			if (
				planogramNumber === null ||
				planogramNumber === undefined ||
				planogramNumber === ''
			) {

				resetBays();

				return;

			}


			selectedPlanogramNumber =
				Number(
					planogramNumber
				);


			baysPanel.hidden =
				false;


			baysHint.hidden =
				true;


			bayList.innerHTML =
				`
					<div class="modular-bay-loading">
						Loading bays...
					</div>
				`;


			bayCount.textContent =
				'Loading...';


			try {

				const rows =
					await apiRequest(
						`${API_BASE}/bays/${encodeURIComponent(
							planogramNumber
						)}`
					);


				if (
					!Array.isArray(rows)
				) {

					throw new Error(
						'Invalid modular bay response.'
					);

				}


				bayCount.textContent =
					`${rows.length} ${
						rows.length === 1
							? 'bay'
							: 'bays'
					}`;


				if (
					!rows.length
				) {

					bayList.innerHTML =
						`
							<div class="modular-bay-empty">
								No bays have been added to this activity yet.
							</div>
						`;

					return;

				}


				bayList.replaceChildren();


				rows.forEach(
					bay => {

						bayList.appendChild(
							renderBay(
								bay
							)
						);

					}
				);


			} catch (error) {

				console.error(
					'Unable to load modular bays:',
					error
				);


				bayCount.textContent =
					'Unable to load';


				bayList.innerHTML =
					`
						<div class="modular-bay-empty">
							${escapeHtml(
								error.message ||
								'Unable to load modular bays.'
							)}
						</div>
					`;

			}

		};


	/* =========================================================
	   RENDER SINGLE BAY
	========================================================= */

	const renderBay =
		(bay) => {

			const row =
				document.createElement(
					'article'
				);


			row.className =
				'modular-bay-row';


			row.dataset.id =
				bay.id;


			const details =
				document.createElement(
					'div'
				);


			details.className =
				'modular-bay-details';


			const bayNumber =
				document.createElement(
					'span'
				);


			bayNumber.className =
				'modular-bay-id';


			bayNumber.textContent =
				`Bay ${bay.bayNumber ?? '—'}`;


			const modularId =
				document.createElement(
					'span'
				);


			modularId.className =
				'modular-bay-modular-id';


			modularId.textContent =
				bay.modularId
					? `Modular ID: ${bay.modularId}`
					: 'No modular ID';


			details.appendChild(
				bayNumber
			);


			details.appendChild(
				modularId
			);


			const status =
				document.createElement(
					'span'
				);


			status.className =
				'modular-bay-status';


			status.textContent =
				bay.status ||
				'Due to land';


			const statusClass =
				String(
					bay.status ||
					'due-to-land'
				)
					.toLowerCase()
					.replace(
						/[^a-z0-9]+/g,
						'-'
					)
					.replace(
						/^-|-$/g,
						''
					);


			status.classList.add(
				`status-${statusClass}`
			);


			const actions =
				document.createElement(
					'div'
				);


			actions.className =
				'modular-bay-actions';


			const deleteButton =
				document.createElement(
					'button'
				);


			deleteButton.type =
				'button';


			deleteButton.className =
				'delete-modular-bay';


			deleteButton.textContent =
				'Delete';


			deleteButton.addEventListener(
				'click',
				async event => {

					event.stopPropagation();


					const confirmed =
						window.confirm(
							`Delete Bay ${bay.bayNumber}?\n\n` +
							'This will also delete any modular items assigned to this bay.'
						);


					if (
						!confirmed
					) {

						return;

					}


					try {

						await apiRequest(
							`${API_BASE}/bays/${bay.id}`,
							{
								method:
									'DELETE'
							}
						);


						if (
							editingBayId ===
							Number(
								bay.id
							)
						) {

							clearBayForm();

						}


						await loadBays(
							selectedPlanogramNumber
						);


					} catch (error) {

						console.error(
							'Unable to delete modular bay:',
							error
						);


						showMessage(
							error.message ||
							'Unable to delete modular bay.',
							true
						);

					}

				}
			);


			actions.appendChild(
				deleteButton
			);


			row.appendChild(
				details
			);


			row.appendChild(
				status
			);


			row.appendChild(
				actions
			);


			row.addEventListener(
				'click',
				() => {

					startBayEdit(
						bay
					);

				}
			);


			return row;

		};


		/* =========================================================
	   ADD BAY
	========================================================= */

	addBayButton.addEventListener(
		'click',
		async () => {

			const bayNumber =
				Number(
					bayNumberInput.value
				);


			const status =
				bayStatusInput.value.trim();


			if (
				!Number.isInteger(
					bayNumber
				)
			) {

				showMessage(
					'Bay number must be a whole number.',
					true
				);

				bayNumberInput.focus();

				return;

			}


			if (
				!status
			) {

				showMessage(
					'Bay status is required.',
					true
				);

				bayStatusInput.focus();

				return;

			}


			if (
				!Number.isInteger(
					Number(
						selectedPlanogramNumber
					)
				)
			) {

				showMessage(
					'Select a modular activity before adding a bay.',
					true
				);

				return;

			}


			try {

				addBayButton.disabled =
					true;


				addBayButton.textContent =
					'Adding...';


				await apiRequest(
					`${API_BASE}/bays`,
					{
						method:
							'POST',

						body:
							JSON.stringify({
								bayNumber,
								status,
								planogramNumber:
									Number(
										selectedPlanogramNumber
									)
							})
					}
				);


				clearBayForm();


				await loadBays(
					selectedPlanogramNumber
				);


				showMessage(
					'Modular bay added.'
				);


			} catch (error) {

				console.error(
					'Unable to add modular bay:',
					error
				);


				showMessage(
					error.message ||
					'Unable to add modular bay.',
					true
				);


			} finally {

				addBayButton.disabled =
					false;


				addBayButton.textContent =
					'Add bay';

			}

		}
	);


	/* =========================================================
	   UPDATE BAY
	========================================================= */

	updateBayButton.addEventListener(
		'click',
		async () => {

			if (
				editingBayId === null
			) {

				return;

			}


			const bayNumber =
				Number(
					bayNumberInput.value
				);


			const status =
				bayStatusInput.value.trim();


			if (
				!Number.isInteger(
					bayNumber
				)
			) {

				showMessage(
					'Bay number must be a whole number.',
					true
				);

				bayNumberInput.focus();

				return;

			}


			if (
				!status
			) {

				showMessage(
					'Bay status is required.',
					true
				);

				bayStatusInput.focus();

				return;

			}


			try {

				updateBayButton.disabled =
					true;


				updateBayButton.textContent =
					'Updating...';


				await apiRequest(
					`${API_BASE}/bays/${editingBayId}`,
					{
						method:
							'PUT',

						body:
							JSON.stringify({
								bayNumber,
								status
							})
					}
				);


				clearBayForm();


				await loadBays(
					selectedPlanogramNumber
				);


				showMessage(
					'Modular bay updated.'
				);


			} catch (error) {

				console.error(
					'Unable to update modular bay:',
					error
				);


				showMessage(
					error.message ||
					'Unable to update modular bay.',
					true
				);


			} finally {

				updateBayButton.disabled =
					false;


				updateBayButton.textContent =
					'Update bay';

			}

		}
	);


	/* =========================================================
	   CLEAR BAY
	========================================================= */

	clearBayButton.addEventListener(
		'click',
		() => {

			clearBayForm();

		}
	);

	/* =========================================================
	   NEW ACTIVITY MODE
	========================================================= */

	const setNewActivityMode =
		() => {

			editingId =
				null;


			formTitle.textContent =
				'New activity';


			saveButton.textContent =
				'Add activity';


			form.classList.remove(
				'editing'
			);


			showMessage(
				''
			);


			resetBays();


			renderActivities();

		};


	/* =========================================================
	   CLEAR FORM
	========================================================= */

	const clearForm =
		() => {

			form.reset();


			editingId =
				null;


			formTitle.textContent =
				'New activity';


			saveButton.textContent =
				'Add activity';


			form.classList.remove(
				'editing'
			);


			showMessage(
				''
			);


			resetBays();


			renderActivities();

		};


	/* =========================================================
	   LOAD ACTIVITIES
	========================================================= */

	const loadActivities =
		async () => {

			activityList.innerHTML =
				`
					<div class="modular-activity-loading">
						Loading activities...
					</div>
				`;


			try {

				const data =
					await apiRequest(
						API_BASE
					);


				activities =
					Array.isArray(data)
						? data
						: [];


				renderActivities();


			} catch (error) {

				console.error(
					'Unable to load modular activity:',
					error
				);


				activityList.innerHTML =
					`
						<div class="modular-activity-empty">
							Unable to load modular activity.
						</div>
					`;


				activityCount.textContent =
					'0 activities';

			}

		};


	/* =========================================================
	   RENDER ACTIVITIES
	========================================================= */

	const renderActivities =
		() => {

			const sortedActivities =
				[...activities].sort(
					(a, b) => {

						const dateA =
							a.dueDate ||
							'9999-12-31';


						const dateB =
							b.dueDate ||
							'9999-12-31';


						if (
							dateA !== dateB
						) {

							return dateA.localeCompare(
								dateB
							);

						}


						const planogramA =
							Number(
								a.planogramNumber
							);


						const planogramB =
							Number(
								b.planogramNumber
							);


						if (
							planogramA !==
							planogramB
						) {

							return (
								planogramA -
								planogramB
							);

						}


						return String(
							a.modularName || ''
						).localeCompare(
							String(
								b.modularName || ''
							)
						);

					}
				);


			activityCount.textContent =
				`${sortedActivities.length} ${
					sortedActivities.length === 1
						? 'activity'
						: 'activities'
				}`;


			if (
				!sortedActivities.length
			) {

				activityList.innerHTML =
					`
						<div class="modular-activity-empty">
							No modular activity has been added yet.
						</div>
					`;

				return;

			}


			activityList.innerHTML =
				sortedActivities
					.map(
						activity =>
							renderActivity(
								activity
							)
					)
					.join('');

		};


	/* =========================================================
	   RENDER SINGLE ACTIVITY
	========================================================= */

	const renderActivity =
		(activity) => {

			const isEditing =
				Number(editingId) ===
				Number(activity.id);


			return `
				<article
					class="modular-activity-row ${
						isEditing
							? 'editing'
							: ''
					}"
					data-id="${escapeHtml(
						activity.id
					)}"
					tabindex="0"
					role="button"
					aria-label="Edit ${
						escapeHtml(
							activity.modularName
						)
					}"
				>

					<div class="modular-activity-details">

						<span class="modular-activity-name">
							${escapeHtml(
								activity.modularName
							)}
						</span>


						<div class="modular-activity-meta">

							<span class="modular-activity-meta-item">
								<strong>
									Department:
								</strong>
								${escapeHtml(
									activity.departmentNumber
								)}
							</span>


							<span class="modular-activity-meta-item">
								<strong>
									Planogram:
								</strong>
								${escapeHtml(
									activity.planogramNumber
								)}
							</span>

						</div>


						<span class="modular-activity-due-date">
							Due:
							${escapeHtml(
								formatDate(
									activity.dueDate
								)
							)}
						</span>

					</div>


					<div class="modular-activity-actions">

						<button
							type="button"
							class="delete-modular-activity"
							data-action="delete"
							data-id="${escapeHtml(
								activity.id
							)}"
						>
							Delete
						</button>

					</div>

				</article>
			`;

		};


	/* =========================================================
	   START EDIT
	========================================================= */

	const startEdit =
		async (id) => {

			const activity =
				activities.find(
					item =>
						Number(item.id) ===
						Number(id)
				);


			if (
				!activity
			) {

				return;

			}


			editingId =
				Number(
					activity.id
				);


			formTitle.textContent =
				'Edit activity';


			saveButton.textContent =
				'Save changes';


			modularNameInput.value =
				activity.modularName || '';


			departmentNumberInput.value =
				activity.departmentNumber ?? '';


			planogramNumberInput.value =
				activity.planogramNumber ?? '';


			dueDateInput.value =
				activity.dueDate || '';


			form.classList.add(
				'editing'
			);


			showMessage(
				''
			);


			renderActivities();


			/* =================================================
			   LOAD BAYS FOR SELECTED ACTIVITY
			================================================= */

			await loadBays(
				activity.planogramNumber
			);


			form.scrollIntoView({
				behavior: 'smooth',
				block: 'start'
			});

		};


	/* =========================================================
	   DELETE ACTIVITY
	========================================================= */

	const deleteActivity =
		async (id) => {

			const activity =
				activities.find(
					item =>
						Number(item.id) ===
						Number(id)
				);


			if (
				!activity
			) {

				return;

			}


			const confirmed =
				window.confirm(
					`Delete "${activity.modularName}"?\n\n` +
					'This will also delete the modular bays and modular items associated with this planogram.'
				);


			if (
				!confirmed
			) {

				return;

			}


			try {

				await apiRequest(
					`${API_BASE}/${id}`,
					{
						method:
							'DELETE'
					}
				);


				if (
					editingId ===
					Number(id)
				) {

					clearForm();

				}


				await loadActivities();


			} catch (error) {

				console.error(
					'Unable to delete modular activity:',
					error
				);


				showMessage(
					error.message ||
					'Unable to delete modular activity.',
					true
				);

			}

		};


	/* =========================================================
	   FORM SUBMIT
	========================================================= */

	form.addEventListener(
		'submit',
		async event => {

			event.preventDefault();


			showMessage(
				''
			);


			const modularName =
				modularNameInput.value.trim();


			const departmentNumber =
				Number(
					departmentNumberInput.value
				);


			const planogramNumber =
				Number(
					planogramNumberInput.value
				);


			const dueDate =
				dueDateInput.value;


			/* =================================================
			   VALIDATION
			================================================= */

			if (
				!modularName
			) {

				showMessage(
					'Modular name is required.',
					true
				);

				modularNameInput.focus();

				return;

			}


			if (
				!Number.isInteger(
					departmentNumber
				)
			) {

				showMessage(
					'Department number must be a whole number.',
					true
				);

				departmentNumberInput.focus();

				return;

			}


			if (
				!Number.isInteger(
					planogramNumber
				)
			) {

				showMessage(
					'Planogram number must be a whole number.',
					true
				);

				planogramNumberInput.focus();

				return;

			}


			if (
				!dueDate
			) {

				showMessage(
					'Due date is required.',
					true
				);

				dueDateInput.focus();

				return;

			}


			const payload = {

				modularName,

				departmentNumber,

				planogramNumber,

				dueDate

			};


			const isEditing =
				editingId !== null;


			try {

				saveButton.disabled =
					true;


				saveButton.textContent =
					isEditing
						? 'Saving...'
						: 'Adding...';


				if (
					isEditing
				) {

					await apiRequest(
						`${API_BASE}/${editingId}`,
						{
							method:
								'PUT',

							body:
								JSON.stringify(
									payload
								)
						}
					);

				} else {

					await apiRequest(
						API_BASE,
						{
							method:
								'POST',

							body:
								JSON.stringify(
									payload
								)
						}
					);

				}


				clearForm();


				await loadActivities();


				showMessage(
					isEditing
						? 'Modular activity updated.'
						: 'Modular activity added.'
				);


			} catch (error) {

				console.error(
					'Unable to save modular activity:',
					error
				);


				showMessage(
					error.message ||
					'Unable to save modular activity.',
					true
				);


			} finally {

				saveButton.disabled =
					false;


				saveButton.textContent =
					editingId !== null
						? 'Save changes'
						: 'Add activity';

			}

		}
	);


	/* =========================================================
	   CLICK ACTIVITY
	========================================================= */

	activityList.addEventListener(
		'click',
		event => {

			const deleteButton =
				event.target.closest(
					'.delete-modular-activity'
				);


			/*
				Delete has its own action.
				Do not open the edit form when
				the Delete button is clicked.
			*/

			if (
				deleteButton
			) {

				deleteActivity(
					Number(
						deleteButton.dataset.id
					)
				);

				return;

			}


			const activityRow =
				event.target.closest(
					'.modular-activity-row'
				);


			if (
				!activityRow
			) {

				return;

			}


			startEdit(
				Number(
					activityRow.dataset.id
				)
			);

		}
	);


	/* =========================================================
	   KEYBOARD ACCESS
	========================================================= */

	activityList.addEventListener(
		'keydown',
		event => {

			if (
				event.key !== 'Enter' &&
				event.key !== ' '
			) {

				return;

			}


			const deleteButton =
				event.target.closest(
					'.delete-modular-activity'
				);


			if (
				deleteButton
			) {

				return;

			}


			const activityRow =
				event.target.closest(
					'.modular-activity-row'
				);


			if (
				!activityRow
			) {

				return;

			}


			event.preventDefault();


			startEdit(
				Number(
					activityRow.dataset.id
				)
			);

		}
	);


	/* =========================================================
	   NEW ACTIVITY
	========================================================= */

	newActivityButton.addEventListener(
		'click',
		() => {

			clearForm();


			modularNameInput.focus();

		}
	);


	/* =========================================================
	   FORM RESET
	========================================================= */

	form.addEventListener(
		'reset',
		() => {

			window.setTimeout(
				() => {

					setNewActivityMode();

				},
				0
			);

		}
	);


	/* =========================================================
	   INITIALISE
	========================================================= */

	resetBays();

	loadActivities();


})();