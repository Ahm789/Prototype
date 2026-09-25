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


	/* =========================================================
	   STATE
	========================================================= */

	let editingId = null;

	let activities = [];


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


		baysPanel.hidden = false;
		baysHint.hidden = true;

		bayList.innerHTML =
			`
				<div class="modular-activity-loading">
					Loading bays...
				</div>
			`;

		bayCount.textContent =
			'Loading...';


		try {

			const response =
				await fetch(
					`${API_ORIGIN}/api/products/modular-bay/${encodeURIComponent(planogramNumber)}`
				);


			if (!response.ok) {

				const data =
					await response
						.json()
						.catch(
							() => ({})
						);

				throw new Error(
					data.error ||
					'Unable to load modular bays.'
				);

			}


			const rows =
				await response.json();


			if (!Array.isArray(rows)) {

				throw new Error(
					'Invalid modular bay response.'
				);

			}


			/* =================================================
			   GROUP ITEMS BY BAY
			================================================= */

			const bays =
				new Map();


			rows.forEach(
				row => {

					const bayId =
						row.bayId ??
						row.bay_id ??
						row.bayNumber ??
						row.bay_number;


					if (
						bayId === null ||
						bayId === undefined
					) {

						return;

					}


					if (
						!bays.has(bayId)
					) {

						bays.set(
							bayId,
							{
								bayId: bayId,

								bayNumber:
									row.bayNumber ??
									row.bay_number ??
									bayId,

								planogramNumber:
									row.planogramNumber ??
									row.planogram_number ??
									planogramNumber,

								modularId:
									row.modularId ??
									row.modular_id ??
									null,

								itemCount: 0
							}
						);

					}


					bays.get(
						bayId
					).itemCount++;

				}
			);


			const uniqueBays =
				Array.from(
					bays.values()
				);


			/* =================================================
			   EMPTY
			================================================= */

			if (!uniqueBays.length) {

				bayCount.textContent =
					'0 bays';

				bayList.innerHTML =
					`
						<div class="modular-activity-empty">
							No bays found for this planogram.
						</div>
					`;

				return;

			}


			/* =================================================
			   BAY COUNT
			================================================= */

			bayCount.textContent =
				`${uniqueBays.length} ${
					uniqueBays.length === 1
						? 'bay'
						: 'bays'
				}`;


			/* =================================================
			   RENDER UNIQUE BAYS
			================================================= */

			bayList.innerHTML =
				uniqueBays
					.map(
						bay =>
							renderBay(
								bay,
								planogramNumber
							)
					)
					.join('');


		} catch (error) {

			console.error(
				'Unable to load modular bays:',
				error
			);


			bayCount.textContent =
				'Unable to load';


			bayList.innerHTML =
				`
					<div class="modular-activity-empty">
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

	/* =========================================================
   RENDER BAY
========================================================= */

const renderBay =
	(
		bay,
		planogramNumber
	) => {

		const bayNumber =
			bay.bayNumber ??
			bay.bayId ??
			'—';

		const modularId =
			bay.modularId ||
			'No modular ID';

		const finalPlanogramNumber =
			bay.planogramNumber ??
			planogramNumber;

		const itemCount =
			Number(
				bay.itemCount || 0
			);

		return `
			<article class="modular-bay-row">

				<div class="modular-bay-details">

					<span class="modular-bay-id">
						Bay ${escapeHtml(
							String(bayNumber)
						)}
					</span>

					<p>
						<strong>Modular ID:</strong>
						${escapeHtml(
							String(modularId)
						)}
					</p>

					<p>
						<strong>Planogram:</strong>
						${escapeHtml(
							String(finalPlanogramNumber)
						)}
					</p>

					<p>
						<strong>Items:</strong>
						${itemCount}
					</p>

				</div>

				<div class="modular-bay-actions">

                    <button class="delete-modular-bay">
                        Delete
                    </button>

                </div>

			</article>
		`;

	};
    document.addEventListener(
	'click',
	(event) => {

		const bayRow =
			event.target.closest(
				'.modular-bay-row'
			);


		if (!bayRow) {
			return;
		}


		/* Ignore Delete */

		if (
			event.target.closest(
				'.delete-modular-bay'
			)
		) {
			return;
		}


		/* Clear existing selection */

		document
			.querySelectorAll(
				'.modular-bay-row.editing'
			)
			.forEach(
				(row) => {

					row.classList.remove(
						'editing'
					);

				}
			);


		/* Select clicked bay */

		bayRow.classList.add(
			'editing'
		);

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