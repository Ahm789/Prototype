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

const modularSearchError =
	document.querySelector(
		'#modular-search-error'
	);

let modularSearchErrorTimeout =
	null;
const modularRemainingCount =
	document.querySelector(
		'#modular-remaining-count'
	);


const modularActivityCurrent =
	document.querySelector(
		'#modular-activity-current'
	);


const modularActivityTotal =
	document.querySelector(
		'#modular-activity-total'
	);
const modularTagAssignmentsContainer =
	document.querySelector(
		'#modular-tag-assignments'
	);
const scanModeToggle =
	document.querySelector(
		'#scan-mode-toggle'
	);
const isStandardScanMode =
	() => {

		return (
			scanModeToggle &&
			scanModeToggle.checked === true
		);

	};
const modularClearModalMessage =
	document.querySelector(
		'#modular-clear-modal-message'
	);
const modularEndTaskButton =
	document.querySelector(
		'#modular-activity-end'
	);
const modularClearModalTitle =
	document.querySelector(
		'#modular-clear-modal-title'
	);
/* =========================================================
   MODULAR SCAN MODE TITLE
========================================================= */

const modularActivityStepTitle =
	document.querySelector(
		'.modular-activity-step-title'
	);


const updateModularActivityStepTitle =
	() => {

		if (
			!modularActivityStepTitle
		) {
			return;
		}


		if (
			scanModeToggle &&
			scanModeToggle.checked
		) {

			modularActivityStepTitle.textContent =
				'Scan all Mod tags in order';

		}
		else {

			modularActivityStepTitle.textContent =
				'Scan first and last Mod Tag';

		}

	};

/* =========================================================
   SMART TAG RANGE
========================================================= */

const generateSmartTagRange =
	(
		firstTag,
		lastTag
	) => {

		const firstParts =
			firstTag.split('-');

		const lastParts =
			lastTag.split('-');


		if (
			firstParts.length !== 4 ||
			lastParts.length !== 4
		) {

			return [];

		}


		const firstPrefix =
			`${firstParts[0]}-${firstParts[1]}-${firstParts[2]}`;

		const lastPrefix =
			`${lastParts[0]}-${lastParts[1]}-${lastParts[2]}`;


		/*
			The first and last Mod Tags must belong
			to the same aisle / side / section.
		*/

		if (
			firstPrefix !== lastPrefix
		) {

			return [];

		}


		const firstNumber =
			Number(
				firstParts[3]
			);

		const lastNumber =
			Number(
				lastParts[3]
			);


		if (
			!Number.isInteger(firstNumber) ||
			!Number.isInteger(lastNumber) ||
			lastNumber < firstNumber
		) {

			return [];

		}


		const tags = [];


		for (
			let number = firstNumber;
			number <= lastNumber;
			number++
		) {

			tags.push(
				`${firstPrefix}-${number}`
			);

		}


		return tags;

	};
/* =========================================================
   INITIAL TITLE
========================================================= */

updateModularActivityStepTitle();


/* =========================================================
   UPDATE WHEN SCAN MODE CHANGES
========================================================= */

if (
	scanModeToggle
) {

	scanModeToggle.addEventListener(
		'change',
		updateModularActivityStepTitle
	);

}
/* =========================================================
   MODULAR SEARCH
========================================================= */
const showModularSearchError = (
	message
) => {

	if (
		!modularSearchError
	) {
		return;
	}


	if (
		modularSearchErrorTimeout
	) {

		clearTimeout(
			modularSearchErrorTimeout
		);

	}


	modularSearchError.textContent =
		message;

	modularSearchError.hidden =
		false;


	modularSearchErrorTimeout =
		setTimeout(
			() => {

				modularSearchError.hidden =
					true;

				modularSearchError.textContent =
					'';

			},
			5000
		);

};
const modularSearchButton =
	document.querySelector(
		'#modular-search-mod-tag'
	);

const modularSearchInput =
	document.querySelector(
		'#modular-search-upc'
	);


const searchModularTag =
	async () => {

		const modularTag =
			modularSearchInput.value
				.trim()
				.toUpperCase();


		/*
			Expected formats:

			FF-14-L-1
			FF-15-R-13
			FF-14-GE1-2
			FF-15-GE2-3
		*/

		const modularTagPattern =
			/^[A-Z0-9]+-[0-9]+-(?:L|R|GE1|GE2)-[0-9]+$/i;


		if (
			!modularTagPattern.test(
				modularTag
			)
		) {

			showModularSearchError(
				'Invalid Mod Tag. Use the format FF-15-L-13, FF-14-GE1-2, etc.'
			);

			return;

		}


				try {

			const response =
				await fetch(
					`${API_ORIGIN}/api/products/modular-tags/` +
					encodeURIComponent(
						modularTag
					)
				);


			if (
				!response.ok
			) {

				showModularSearchError(
					'Mod Tag not found. Use a valid tag such as FF-15-L-13 or FF-14-GE1-2.'
				);

				return;

			}


			const result =
				await response.json();


			if (
				!result ||
				result.exists !== true
			) {

				showModularSearchError(
					'Mod Tag not found. Use a valid tag such as FF-15-L-13 or FF-14-GE1-2.'
				);

				return;

			}


			/*
				Prevent the same Mod Tag
				from being submitted twice.
			*/

			const alreadySubmitted =
				modularTagAssignments.some(
					assignment =>
						assignment.modularTag ===
						modularTag
				);


			if (
				alreadySubmitted
			) {

				showModularSearchError(
					'This Mod Tag has already been submitted.'
				);

				return;

			}


			/*
				Valid Mod Tag.
				Temporarily assign it
				to the next modular.
			*/

			if (
				isStandardScanMode()
			) {

				/*
					Standard mode:
					add each scanned Mod Tag individually.
				*/

				addModularTagAssignment(
					modularTag
				);

			}
			else {

				/*
					Smart Tag mode:
					the first scanned tag is stored,
					then the second scanned tag completes
					the range.
				*/

				if (
					modularTagAssignments.length === 0
				) {

					modularTagAssignments.push({
						modular:
							requiredModulars[0],

						modularTag:
							modularTag,

						smartTagStart:
							true
					});


					renderModularTagAssignments();

					updateModularActivityCounters();

					updateModularBayCompletionStates();


					if (
						modularSearchInput
					) {

						modularSearchInput.value =
							'';

						modularSearchInput.focus();

					}


					return;

				}


				const firstTag =
					modularTagAssignments[0].modularTag;


				const smartTagRange =
					generateSmartTagRange(
						firstTag,
						modularTag
					);


				if (
					smartTagRange.length === 0
				) {

					showModularSearchError(
						'The first and last Mod Tags must be in the same section, with the last tag after the first.'
					);

					return;

				}


				/* =================================================
				PREVENT SMART RANGE EXCEEDING AVAILABLE MODULARS
				================================================= */

				if (
					smartTagRange.length >
					requiredModulars.length
				) {

					showModularSearchError(
						`This Mod Tag range contains ${smartTagRange.length} mods, but only ${requiredModulars.length} are available.`
					);

					return;

				}


				/*
					Remove the temporary first-tag entry.
				*/

				modularTagAssignments.length =
					0;


				/*
					Generate every Mod Tag in the range.
				*/

				smartTagRange.forEach(
					(
						tag,
						index
					) => {

						modularTagAssignments.push({
							modular:
								requiredModulars[
									index
								] ?? null,

							modularTag:
								tag
						});

					}
				);


				renderModularTagAssignments();

				updateModularActivityCounters();

				updateModularBayCompletionStates();


				/* =============================================
				   LOCK MOD TAG ENTRY WHEN ALL MODULARS ARE FILLED
				============================================= */

				if (
					modularTagAssignments.length >=
					requiredModulars.length
				) {

					if (
						modularSearchInput
					) {

						modularSearchInput.disabled =
							true;

					}


					if (
						modularSearchButton
					) {

						modularSearchButton.disabled =
							true;

					}


					console.log(
						'All required Mod Tags have been entered.'
					);

				}


				console.log(
					'Smart Tag range generated:',
					modularTagAssignments
				);

			}


			/*
				Clear the search field
				after successful submission.
			*/

			if (
				modularSearchInput
			) {

				modularSearchInput.value =
					'';

				modularSearchInput.focus();

			}

		} catch (error) {

			console.error(
				'Unable to find Mod Tag:',
				error
			);


			showModularSearchError(
				'Unable to find this Mod Tag. Please try again.'
			);

		}

	};


if (
	modularSearchButton
) {

	modularSearchButton.addEventListener(
		'click',
		event => {

			event.preventDefault();

			searchModularTag();

		}
	);

}


if (
	modularSearchInput
) {

	modularSearchInput.addEventListener(
		'keydown',
		event => {

			if (
				event.key === 'Enter'
			) {

				event.preventDefault();

				searchModularTag();

			}

		}
	);

}
/* =========================================================
   TEMPORARY MOD TAG ASSIGNMENTS
========================================================= */

const modularTagAssignments = [];


let requiredModulars = [];
const updateModularActivityCounters =
	() => {

		const total =
			requiredModulars.length;


		const current =
			modularTagAssignments.length;


		const remaining =
			Math.max(
				total - current,
				0
			);


		if (
			modularRemainingCount
		) {

			modularRemainingCount.textContent =
				remaining;

		}


		if (
			modularActivityCurrent
		) {

			modularActivityCurrent.textContent =
				current;

		}


		if (
			modularActivityTotal
		) {

			modularActivityTotal.textContent =
				total;

		}

	};
	updateModularActivityCounters();

const addModularTagAssignment =
	(
		modularTag
	) => {

		const nextModular =
			requiredModulars.find(
				modular =>
					!modularTagAssignments.some(
						assignment =>
							Number(
								assignment.modular
							) ===
							Number(
								modular
							)
					)
			);
		if (
			nextModular === undefined
		) {
			return;
		}


		modularTagAssignments.push({
			modular: nextModular,
			modularTag: modularTag
		});

		modularTagAssignments.sort(
			(
				a,
				b
			) =>
				Number(
					a.modular
				) -
				Number(
					b.modular
				)
		);

		renderModularTagAssignments();
		updateModularActivityCounters();
		updateModularBayCompletionStates();

		console.log(
			'Temporary Mod Tag Assignments:',
			modularTagAssignments
		);


		console.table(
			modularTagAssignments
		);


		if (
			modularTagAssignments.length >=
			requiredModulars.length
		) {

			if (
				modularSearchInput
			) {

				modularSearchInput.disabled =
					true;

			}


			if (
				modularSearchButton
			) {

				modularSearchButton.disabled =
					true;

			}


			console.log(
				'All required Mod Tags have been entered.'
			);

		}

	};
/* =========================================================
   MOD TAG ASSIGNMENTS RENDERING
========================================================= */
const renderModularTagAssignments =
	() => {

		if (
			!modularTagAssignmentsContainer
		) {
			return;
		}


		modularTagAssignmentsContainer.innerHTML =
			'';


		/*
			Always display assignments
			in ascending modular/bay order.
		*/

		const sortedAssignments =
			[
				...modularTagAssignments
			].sort(
				(
					a,
					b
				) =>
					Number(
						a.modular
					) -
					Number(
						b.modular
					)
			);


		sortedAssignments.forEach(
			(
				assignment,
				index
			) => {

				const assignmentWrapper =
					document.createElement(
						'div'
					);


				assignmentWrapper.className =
					'modular-tag-assignment';


				const assignmentLabel =
					document.createElement(
						'div'
					);


				assignmentLabel.className =
					'modular-tag-assignment-label';


				assignmentLabel.textContent =
					`Bay ${assignment.modular} mod tag`;


				const assignmentRow =
					document.createElement(
						'div'
					);


				assignmentRow.className =
					'modular-tag-assignment-row';


				const assignmentIndex =
					document.createElement(
						'div'
					);


				assignmentIndex.className =
					'modular-tag-assignment-index';


				assignmentIndex.textContent =
					index + 1;


				const assignmentValue =
					document.createElement(
						'div'
					);


				assignmentValue.className =
					'modular-tag-assignment-value';


				assignmentValue.textContent =
					assignment.modularTag;


				const removeButton =
					document.createElement(
						'button'
					);


				removeButton.type =
					'button';


				removeButton.className =
					'modular-tag-assignment-remove';


				removeButton.setAttribute(
					'aria-label',
					`Remove Mod Tag for Bay ${assignment.modular}`
				);


				removeButton.innerHTML = `
					<i
						data-lucide="x"
						aria-hidden="true"
					></i>
				`;


				removeButton.addEventListener(
					'click',
					() => {

						const assignmentIndex =
							modularTagAssignments.findIndex(
								item =>
									item.modular ===
									assignment.modular
							);


						if (
							assignmentIndex !== -1
						) {

							modularTagAssignments.splice(
								assignmentIndex,
								1
							);

						}


						renderModularTagAssignments();


						updateModularActivityCounters();

						updateModularBayCompletionStates();


						if (
							modularSearchInput
						) {

							modularSearchInput.disabled =
								false;

						}


						if (
							modularSearchButton
						) {

							modularSearchButton.disabled =
								false;

						}


						console.log(
							'Temporary Mod Tag Assignments:',
							modularTagAssignments
						);


						console.table(
							modularTagAssignments
						);

					}
				);


				assignmentRow.appendChild(
					assignmentIndex
				);


				assignmentRow.appendChild(
					assignmentValue
				);


				assignmentRow.appendChild(
					removeButton
				);


				assignmentWrapper.appendChild(
					assignmentLabel
				);


				assignmentWrapper.appendChild(
					assignmentRow
				);


				modularTagAssignmentsContainer.appendChild(
					assignmentWrapper
				);

			}
		);


		lucide.createIcons();

	};
/* =========================================================
   UPDATE MODULAR BAY COMPLETION STATES
========================================================= */

const updateModularBayCompletionStates =
	() => {

		const bayWrappers =
			document.querySelectorAll(
				'.modular-activity-bay-image-wrapper'
			);


		bayWrappers.forEach(
			bayWrapper => {

				const bayNumber =
					Number(
						bayWrapper.dataset.bayNumber
					);


				const isAssigned =
					modularTagAssignments.some(
						assignment =>
							Number(
								assignment.modular
							) ===
							bayNumber
					);


				const overlay =
					bayWrapper.querySelector(
						'.modular-activity-bay-image-overlay'
					);


				if (
					isAssigned
				) {

					bayWrapper.classList.add(
						'completed'
					);


					if (
						!overlay
					) {

						const completionOverlay =
							document.createElement(
								'div'
							);

						completionOverlay.className =
							'modular-activity-bay-image-overlay';


						const check =
							document.createElement(
								'div'
							);

						check.className =
							'modular-activity-bay-check';

						check.textContent =
							'✓';


						completionOverlay.appendChild(
							check
						);


						bayWrapper.appendChild(
							completionOverlay
						);

					}

				}
				else {

					bayWrapper.classList.remove(
						'completed'
					);


					if (
						overlay
					) {

						overlay.remove();

					}

				}

			}
		);

	};
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

			modularClearModalAction =
				'end';


			if (
				modularClearModalTitle
			) {

				modularClearModalTitle.textContent =
					'Cancel Modular Activity?';

			}


			if (
				modularClearModalMessage
			) {

				modularClearModalMessage.textContent =
					'Are you sure you want to cancel this Modular Activity? All progress will be lost';

			}


			if (
				modularClearModalConfirm
			) {

				modularClearModalConfirm.textContent =
					'End Task';

			}


			openModularClearModal();
		}
	);

}

/* =========================================================
   GET MODULAR BAY PRODUCTS
========================================================= */

const getModularBayProducts =
	async (
		planogramNumber
	) => {

		try {

			const response =
				await fetch(
					`${API_BASE}/modular-bay/${encodeURIComponent(planogramNumber)}`
				);


			if (
				!response.ok
			) {

				throw new Error(
					`Failed to load modular bay products: ${response.status}`
				);

			}


			const products =
				await response.json();


			return products;

		}
		catch (
			error
		) {

			console.error(
				'Failed to get modular bay products:',
				error
			);

			return [];

		}

	};
/* =========================================================
   CREATE MODULAR BAY SNAPSHOTS
========================================================= */

const createModularBaySnapshot =
	async (
		planogramNumber
	) => {

		const products =
			await getModularBayProducts(
				planogramNumber
			);

		if (
			!Array.isArray(products) ||
			products.length === 0
		) {
			return null;
		}


		/* =====================================================
		   SHARED BAY DIMENSIONS
		===================================================== */

		const shelfHeight =
			90;

		const gap =
			8;

		const bayWidth =
			800;

		const minimumBayHeight =
			300;

		const cropPadding =
			0;


		/* =====================================================
		   CROP PRODUCT IMAGE TO VISIBLE CONTENT
		===================================================== */

		const cropProductImage =
			imageUrl =>
				new Promise(
					resolve => {

						const image =
							new Image();

						image.crossOrigin =
							'anonymous';

						image.onload =
							() => {

								try {

									const naturalWidth =
										image.naturalWidth;

									const naturalHeight =
										image.naturalHeight;


									if (
										!naturalWidth ||
										!naturalHeight
									) {

										resolve(
											null
										);

										return;

									}


									/* =================================
									   CREATE SOURCE CANVAS
									================================= */

									const sourceCanvas =
										document.createElement(
											'canvas'
										);

									sourceCanvas.width =
										naturalWidth;

									sourceCanvas.height =
										naturalHeight;


									const sourceContext =
										sourceCanvas.getContext(
											'2d',
											{
												willReadFrequently:
													true
											}
										);


									sourceContext.drawImage(
										image,
										0,
										0,
										naturalWidth,
										naturalHeight
									);


									const imageData =
										sourceContext.getImageData(
											0,
											0,
											naturalWidth,
											naturalHeight
										);


									const pixels =
										imageData.data;


									/* =================================
									   FIND NON-WHITE CONTENT
									================================= */

									let left =
										naturalWidth;

									let right =
										-1;

									let top =
										naturalHeight;

									let bottom =
										-1;


									for (
										let y = 0;
										y < naturalHeight;
										y++
									) {

										for (
											let x = 0;
											x < naturalWidth;
											x++
										) {

											const index =
												(
													(
														y *
														naturalWidth
													) +
													x
												) *
												4;


											const red =
												pixels[
													index
												];

											const green =
												pixels[
													index + 1
												];

											const blue =
												pixels[
													index + 2
												];

											const alpha =
												pixels[
													index + 3
												];


											/*
											   Treat transparent
											   and near-white pixels
											   as background.
											*/

											const isTransparent =
												alpha <
												20;

											const isWhite =
												red >= 245 &&
												green >= 245 &&
												blue >= 245;


											if (
												!isTransparent &&
												!isWhite
											) {

												left =
													Math.min(
														left,
														x
													);

												right =
													Math.max(
														right,
														x
													);

												top =
													Math.min(
														top,
														y
													);

												bottom =
													Math.max(
														bottom,
														y
													);

											}

										}

									}


									/* =================================
									   FALLBACK TO FULL IMAGE
									================================= */

									if (
										right < left ||
										bottom < top
									) {

										resolve({
											url:
												imageUrl,

											width:
												naturalWidth,

											height:
												naturalHeight
										});

										return;

									}


									/* =================================
									   APPLY CROP PADDING
									================================= */

									left =
										Math.max(
											0,
											left -
											cropPadding
										);

									top =
										Math.max(
											0,
											top -
											cropPadding
										);

									right =
										Math.min(
											naturalWidth - 1,
											right +
											cropPadding
										);

									bottom =
										Math.min(
											naturalHeight - 1,
											bottom +
											cropPadding
										);


									const croppedWidth =
										right -
										left +
										1;

									const croppedHeight =
										bottom -
										top +
										1;


									/* =================================
									   CREATE CROPPED CANVAS
									================================= */

									const croppedCanvas =
										document.createElement(
											'canvas'
										);

									croppedCanvas.width =
										croppedWidth;

									croppedCanvas.height =
										croppedHeight;


									const croppedContext =
										croppedCanvas.getContext(
											'2d'
										);


									croppedContext.drawImage(
										image,

										left,
										top,
										croppedWidth,
										croppedHeight,

										0,
										0,
										croppedWidth,
										croppedHeight
									);


									resolve({
										url:
											croppedCanvas.toDataURL(
												'image/png'
											),

										width:
											croppedWidth,

										height:
											croppedHeight
									});

								}
								catch (
									error
								) {

									console.error(
										'Failed to crop product image:',
										error
									);

									resolve(
										null
									);

								}

							};


						image.onerror =
							() =>
								resolve(
									null
								);


						image.src =
							imageUrl;

					}
				);


		/* =====================================================
		   GROUP PRODUCTS BY BAY
		===================================================== */

		const bays =
			new Map();

		products.forEach(
			product => {

				const bayNumber =
					String(
						product.bayNumber ?? ''
					).trim();

				if (!bays.has(bayNumber)) {

					bays.set(
						bayNumber,
						[]
					);

				}

				bays
					.get(bayNumber)
					.push(product);

			}
		);
				/* =====================================================
		   SORT BAYS NUMERICALLY
		===================================================== */

		const sortedBays =
			[
				...bays.entries()
			].sort(
				(
					[a],
					[b]
				) =>
					Number(a) -
					Number(b)
			);


		/* =====================================================
		   CALCULATE SHARED BAY HEIGHT
		===================================================== */

		const maxShelfCount =
			Math.max(
				...[
					...bays.values()
				].map(
					bayProducts =>
						new Set(
							bayProducts.map(
								product =>
									String(
										product.shelf ?? ''
									).trim()
							)
						).size
				)
			);


		const calculatedBayHeight =
			(
				maxShelfCount *
				shelfHeight
			) +
			(
				Math.max(
					0,
					maxShelfCount - 1
				) *
				gap
			);


		const bayHeight =
			Math.max(
				minimumBayHeight,
				calculatedBayHeight
			);


		/* =====================================================
		   GENERATE ONE SNAPSHOT PER BAY
		===================================================== */

		const snapshots = [];


		/*
		   Store the cropped canvas information first.

		   This lets us find the widest snapshot before
		   creating the final images.

		   The widest snapshot naturally produces the
		   smallest displayed height when all images use
		   width: 100%.
		*/

		const pendingSnapshots = [];


		for (
			const [
				bayNumber,
				bayProducts
			]
			of sortedBays
		) {

			/* =================================================
			   CREATE TEMPORARY MODULAR VISUAL
			================================================= */

			const modularVisual =
				document.createElement(
					'div'
				);

			modularVisual.className =
				'modular-visual';

			modularVisual.style.width =
				`${bayWidth}px`;

			modularVisual.style.height =
				`${bayHeight}px`;

			modularVisual.style.minHeight =
				`${bayHeight}px`;

			modularVisual.style.maxWidth =
				'none';

			modularVisual.style.boxSizing =
				'border-box';

			modularVisual.style.background =
				'#ffffff';

			modularVisual.style.position =
				'absolute';

			modularVisual.style.left =
				'-99999px';

			modularVisual.style.top =
				'0';

			modularVisual.style.visibility =
				'visible';

			modularVisual.style.overflow =
				'hidden';

			document.body.appendChild(
				modularVisual
			);


			/* =================================================
			   GROUP PRODUCTS BY SHELF
			================================================= */

			const shelves =
				new Map();

			bayProducts.forEach(
				product => {

					const shelf =
						String(
							product.shelf ?? ''
						).trim();

					if (!shelves.has(shelf)) {

						shelves.set(
							shelf,
							[]
						);

					}

					shelves
						.get(shelf)
						.push(product);

				}
			);


			/* =================================================
			   SORT SHELVES
			===================================================== */

			const sortedShelves =
				[...shelves.entries()]
					.sort(
						([shelfA], [shelfB]) => {

							const numberA =
								parseInt(
									shelfA.replace(
										/[^0-9]/g,
										''
									),
									10
								);

							const numberB =
								parseInt(
									shelfB.replace(
										/[^0-9]/g,
										''
									),
									10
								);

							if (
								Number.isNaN(
									numberA
								)
							) {
								return 1;
							}

							if (
								Number.isNaN(
									numberB
								)
							) {
								return -1;
							}

							return (
								numberA -
								numberB
							);

						}
					);


			/* =================================================
			   CREATE SHELF ROWS
			===================================================== */

			sortedShelves.forEach(
				([
					shelf,
					shelfProducts
				]) => {

					shelfProducts.sort(
						(a, b) =>
							Number(
								a.shelfOrder ?? 0
							) -
							Number(
								b.shelfOrder ?? 0
							)
					);


					const shelfRow =
						document.createElement(
							'div'
						);

					shelfRow.className =
						'modular-shelf';

					shelfRow.style.width =
						`${bayWidth}px`;

					shelfRow.style.height =
						`${shelfHeight}px`;

					shelfRow.style.minHeight =
						`${shelfHeight}px`;

					shelfRow.style.flex =
						`0 0 ${shelfHeight}px`;

					shelfRow.style.boxSizing =
						'border-box';

					shelfRow.style.display =
						'flex';

					shelfRow.style.alignItems =
						'center';

					shelfRow.style.justifyContent =
						'center';

					shelfRow.style.overflow =
						'hidden';


					const productsContainer =
						document.createElement(
							'div'
						);

					productsContainer.className =
						'modular-shelf-products';

					productsContainer.style.display =
						'flex';

					productsContainer.style.alignItems =
						'center';

					productsContainer.style.justifyContent =
						'center';

					productsContainer.style.width =
						'100%';

					productsContainer.style.height =
						`${shelfHeight}px`;

					productsContainer.style.minHeight =
						`${shelfHeight}px`;

					productsContainer.style.gap =
						`${gap}px`;

					productsContainer.style.boxSizing =
						'border-box';

					productsContainer.style.overflow =
						'hidden';


					shelfRow.appendChild(
						productsContainer
					);

					modularVisual.appendChild(
						shelfRow
					);

				}
			);


			/* =================================================
			   WAIT FOR SHELF LAYOUT
			===================================================== */

			await new Promise(
				resolve =>
					requestAnimationFrame(
						resolve
					)
			);


			/* =================================================
			   RENDER EACH SHELF
			===================================================== */

			const shelfRows =
				[
					...modularVisual.querySelectorAll(
						'.modular-shelf'
					)
				];


			for (
				let shelfIndex = 0;
				shelfIndex < shelfRows.length;
				shelfIndex++
			) {

				const shelfRow =
					shelfRows[
						shelfIndex
					];

				const productsContainer =
					shelfRow.querySelector(
						'.modular-shelf-products'
					);


				const [
					,
					shelfProducts
				] =
					sortedShelves[
						shelfIndex
					];


				/* =============================================
				   LOAD + CROP PRODUCT IMAGES
				============================================= */

				const loadedProducts =
					await Promise.all(
						shelfProducts
							.filter(
								product =>
									product.image &&
									product.image.url
							)
							.map(
								async product => {

									const croppedImage =
										await cropProductImage(
											product.image.url
										);


									if (
										!croppedImage
									) {
										return null;
									}


									/*
									   Scale the cropped
									   content to the full
									   shelf height while
									   preserving its
									   aspect ratio.
									*/

									const width =
										(
											croppedImage.width /
											croppedImage.height
										) *
										shelfHeight;


									return {
										product,

										url:
											croppedImage.url,

										width
									};

								}
							)
					);


				const usableProducts =
					loadedProducts.filter(
						Boolean
					);


				if (
					!usableProducts.length
				) {
					continue;
				}


				/* =============================================
				   CALCULATE NATURAL SHELF WIDTH
				============================================= */

				const totalNaturalProductWidth =
					usableProducts.reduce(
						(total, { width, product }) => {

							const facings =
								Math.max(
									1,
									Number(
										product.facings ?? 1
									)
								);

							return (
								total +
								(
									width *
									facings
								)
							);

						},
						0
					);


				const totalProductGaps =
					usableProducts.reduce(
						(total, { product }) => {

							const facings =
								Math.max(
									1,
									Number(
										product.facings ?? 1
									)
								);

							return (
								total +
								Math.max(
									0,
									facings - 1
								)
							);

						},
						0
					) *
					gap;


				const groupGaps =
					Math.max(
						0,
						usableProducts.length - 1
					) *
					gap;


				const naturalShelfWidth =
					totalNaturalProductWidth +
					totalProductGaps +
					groupGaps;


				/* =============================================
				   DETERMINE DISPLAY SCALE
				============================================= */

				const shelfScale =
					naturalShelfWidth > bayWidth
						? bayWidth / naturalShelfWidth
						: 1;


				productsContainer.style.width =
					`${naturalShelfWidth}px`;

				productsContainer.style.flex =
					'0 0 auto';

				productsContainer.style.justifyContent =
					'flex-start';


				if (
					shelfScale < 1
				) {

					productsContainer.style.transformOrigin =
						'center center';

					productsContainer.style.transform =
						`scaleX(${shelfScale})`;

				}


				/* =============================================
				   CREATE PRODUCT GROUPS + FACINGS
				============================================= */

				usableProducts.forEach(
					({
						product,
						url,
						width
					}) => {

						const productGroup =
							document.createElement(
								'div'
							);

						productGroup.className =
							'modular-product-group';

						productGroup.style.display =
							'flex';

						productGroup.style.flexDirection =
							'row';

						productGroup.style.alignItems =
							'center';

						productGroup.style.gap =
							`${gap}px`;

						productGroup.style.flex =
							'0 0 auto';


						const facings =
							Math.max(
								1,
								Number(
									product.facings ?? 1
								)
							);


						/* =====================================
						   CREATE ONE IMAGE PER FACING
						===================================== */

						for (
							let i = 0;
							i < facings;
							i++
						) {

							const facing =
								document.createElement(
									'img'
								);

							facing.src =
								url;

							facing.alt =
								product.image.alt ||
								product.description ||
								'Product';

							facing.className =
								'modular-product-image';


							/* =================================
							   CROPPED CONTENT FILLS HEIGHT
							================================= */

							facing.style.display =
								'block';

							facing.style.height =
								`${shelfHeight}px`;

							facing.style.width =
								`${width}px`;

							facing.style.minWidth =
								`${width}px`;

							facing.style.maxWidth =
								`${width}px`;

							facing.style.flex =
								`0 0 ${width}px`;

							facing.style.objectFit =
								'fill';

							facing.style.objectPosition =
								'center center';


							productGroup.appendChild(
								facing
							);

						}


						productsContainer.appendChild(
							productGroup
						);

					}
				);

			}


			/* =================================================
			   WAIT FOR ALL IMAGES
			===================================================== */

			const images =
				[
					...modularVisual.querySelectorAll(
						'img'
					)
				];


			await Promise.all(
				images.map(
					image => {

						if (
							image.complete
						) {
							return Promise.resolve();
						}

						return new Promise(
							resolve => {

								image.onload =
									resolve;

								image.onerror =
									resolve;

							}
						);

					}
				)
			);


			/* =================================================
			   FINAL LAYOUT PASS
			===================================================== */

			await new Promise(
				resolve =>
					requestAnimationFrame(
						() =>
							requestAnimationFrame(
								resolve
							)
					)
			);


			/* =================================================
			   FIND ACTUAL HORIZONTAL CONTENT BOUNDS
			===================================================== */

			const renderedImages =
				[
					...modularVisual.querySelectorAll(
						'img'
					)
				];


			let contentLeft =
				bayWidth;

			let contentRight =
				0;


			renderedImages.forEach(
				image => {

					const rect =
						image.getBoundingClientRect();

					const visualRect =
						modularVisual.getBoundingClientRect();

					const left =
						rect.left -
						visualRect.left;

					const right =
						rect.right -
						visualRect.left;

					contentLeft =
						Math.min(
							contentLeft,
							left
						);

					contentRight =
						Math.max(
							contentRight,
							right
						);

				}
			);


			if (
				contentRight <= contentLeft
			) {

				contentLeft =
					0;

				contentRight =
					bayWidth;

			}


			contentLeft =
				Math.max(
					0,
					Math.floor(
						contentLeft -
						cropPadding
					)
				);

			contentRight =
				Math.min(
					bayWidth,
					Math.ceil(
						contentRight +
						cropPadding
					)
				);


			const croppedWidth =
				Math.max(
					1,
					contentRight -
					contentLeft
				);


			/* =================================================
			   CREATE FULL CANVAS
			===================================================== */

			const canvas =
				await html2canvas(
					modularVisual,
					{
						backgroundColor:
							'#ffffff',

						scale:
							2,

						useCORS:
							true,

						width:
							bayWidth,

						height:
							bayHeight
					}
				);


			/* =================================================
			   CROP HORIZONTAL WHITE SPACE
			===================================================== */

			const cropCanvas =
				document.createElement(
					'canvas'
				);

			cropCanvas.width =
				croppedWidth * 2;

			cropCanvas.height =
				bayHeight * 2;


			const cropContext =
				cropCanvas.getContext(
					'2d'
				);


			cropContext.drawImage(
				canvas,
				contentLeft * 2,
				0,
				croppedWidth * 2,
				bayHeight * 2,
				0,
				0,
				croppedWidth * 2,
				bayHeight * 2
			);


			/*
			   Store the cropped canvas rather than
			   immediately creating the final snapshot.

			   We need to know the widest bay first so
			   every snapshot can use the same aspect ratio.
			*/

			pendingSnapshots.push({
				bayNumber,
				cropCanvas,
				croppedWidth
			});


			/* =================================================
			   REMOVE TEMPORARY VISUAL
			===================================================== */

			modularVisual.remove();

		}


		/* =====================================================
		   FIND WIDEST SNAPSHOT
		===================================================== */

		const widestSnapshotWidth =
			Math.max(
				...pendingSnapshots.map(
					snapshot =>
						snapshot.croppedWidth
				)
			);


		/* =====================================================
		   NORMALISE SNAPSHOT WIDTHS
		===================================================== */

		pendingSnapshots.forEach(
			({
				bayNumber,
				cropCanvas,
				croppedWidth
			}) => {

				/*
				   Every snapshot keeps the same height.

				   The widest snapshot therefore determines
				   the smallest displayed height.

				   Narrower snapshots receive white space
				   on the left and right so they share the
				   exact same aspect ratio.
				*/

				const normalisedCanvas =
					document.createElement(
						'canvas'
					);

				normalisedCanvas.width =
					widestSnapshotWidth * 2;

				normalisedCanvas.height =
					bayHeight * 2;


				const normalisedContext =
					normalisedCanvas.getContext(
						'2d'
					);


				/* =============================================
				   WHITE BACKGROUND
				============================================= */

				normalisedContext.fillStyle =
					'#ffffff';

				normalisedContext.fillRect(
					0,
					0,
					normalisedCanvas.width,
					normalisedCanvas.height
				);


				/* =============================================
				   CENTRE ORIGINAL SNAPSHOT
				============================================= */

				const horizontalOffset =
					(
						widestSnapshotWidth -
						croppedWidth
					) *
					2 /
					2;


				normalisedContext.drawImage(
					cropCanvas,
					horizontalOffset,
					0
				);


				const snapshot =
					normalisedCanvas.toDataURL(
						'image/png'
					);


				snapshots.push({
					bayNumber,
					snapshot
				});

			}
		);


		return snapshots;

	};
/* =========================================================
   LOAD MODULAR ACTIVITY BAYS
========================================================= */

const loadModularActivityBays =
	async () => {

		if (
			!planogramNumber
		) {

			console.error(
				'No planogram number was provided.'
			);

			return;

		}


		/* =================================================
		   FIND STEP 1
		================================================= */

		const step =
			document.querySelector(
				'.modular-activity-step'
			);


		if (
			!step
		) {

			console.error(
				'Modular activity Step 1 was not found.'
			);

			return;

		}


		/* =================================================
		   CREATE LOADING STATE
		================================================= */

		const loading =
			document.createElement(
				'div'
			);

		loading.className =
			'modular-activity-snapshot-loading';

		loading.textContent =
			'Loading modular bays...';


		step.appendChild(
			loading
		);


		try {

			const snapshots =
				await createModularBaySnapshot(
					planogramNumber
				);


			/* =================================================
			   REMOVE LOADING STATE
			================================================= */

			loading.remove();


			if (
				!Array.isArray(snapshots) ||
				snapshots.length === 0
			) {

				console.warn(
					'No modular bay snapshots found.'
				);

				return;

			}
			/* =================================================
				SET REQUIRED MODULARS FROM BAY IMAGE ORDER
				================================================= */

				requiredModulars =
					snapshots.map(
						({
							bayNumber
						}) =>
							Number(
								bayNumber
							)
					);

				updateModularActivityCounters();

			/* =================================================
			   CREATE SNAPSHOT CONTAINER
			================================================= */

			const snapshotContainer =
				document.createElement(
					'div'
				);

			snapshotContainer.className =
				'modular-activity-snapshots';

			const previewBayCount =
				document.querySelector(
					'#modular-preview-bay-count'
				);
			const modularActivityTotal =
				document.querySelector(
					'#modular-activity-total'
				);


			if (
				modularActivityTotal
			) {

				modularActivityTotal.textContent =
					snapshots.length;

			}


			if (
				previewBayCount
			) {

				previewBayCount.textContent =
					snapshots.length;

			}
			/* =================================================
			   CREATE BAY SNAPSHOTS
			================================================= */

			snapshots.forEach(
				({
					bayNumber,
					snapshot
				}) => {

					const bayContainer =
						document.createElement(
							'div'
						);

					bayContainer.className =
						'modular-activity-bay';


					/* =========================================
					   BAY LABEL
					========================================= */

					const bayLabel =
						document.createElement(
							'div'
						);

					bayLabel.className =
						'modular-activity-bay-label';

					bayLabel.textContent =
						`Bay ${bayNumber}`;


					/* =========================================
					BAY IMAGE
					========================================= */

					const bayImageWrapper =
						document.createElement(
							'div'
						);


					bayImageWrapper.className =
						'modular-activity-bay-image-wrapper';


					bayImageWrapper.dataset.bayNumber =
						bayNumber;


					const bayImage =
						document.createElement(
							'img'
						);

					bayImage.className =
						'modular-activity-bay-image';

					bayImage.src =
						snapshot;

					bayImage.alt =
						`Modular bay ${bayNumber}`;

					bayImage.draggable =
						false;


					bayImageWrapper.appendChild(
						bayImage
					);


					bayContainer.appendChild(
						bayLabel
					);

					bayContainer.appendChild(
						bayImageWrapper
					);

					snapshotContainer.appendChild(
						bayContainer
					);

				}
			);


			/* =================================================
			   PLACE BAYS INSIDE STEP 1
			================================================= */

			step.appendChild(
				snapshotContainer
			);


			/* =================================================
			   ENABLE BAY IMAGE ZOOM
			================================================= */

			enableModularBayImageZoom();


			/* =================================================
			   REFRESH LUCIDE ICONS
			================================================= */

			lucide.createIcons();

		}
		catch (
			error
		) {

			console.error(
				'Failed to load modular activity bays:',
				error
			);


			loading.textContent =
				'Failed to load modular bays.';

		}

	};

/* =========================================================
   BAY IMAGE ZOOM
========================================================= */

const enableModularBayImageZoom =
	() => {

		const bayImages =
			document.querySelectorAll(
				'.modular-activity-bay-image'
			);


		bayImages.forEach(
			bayImage => {

				bayImage.addEventListener(
					'click',
					() => {

						const overlay =
							document.createElement(
								'div'
							);

						overlay.className =
							'modular-activity-snapshot-overlay';


						const largeImage =
							document.createElement(
								'img'
							);

						largeImage.className =
							'modular-activity-snapshot-large';

						largeImage.src =
							bayImage.src;

						largeImage.alt =
							bayImage.alt;


						overlay.appendChild(
							largeImage
						);


						document.body.appendChild(
							overlay
						);


						overlay.addEventListener(
							'click',
							event => {

								if (
									event.target ===
									overlay
								) {

									overlay.remove();

								}

							}
						);

					}
				);

			}
		);

	};
	/* =========================================================
   MOD TAG CAMERA BUTTON
========================================================= */

const modularSearchCamera =
    document.querySelector(
        '#modular-search-camera'
    );
if (
    modularSearchCamera
) {

    modularSearchCamera.addEventListener(
        'click',
        () => {

            startModularTagScanner(
                async (
                    modularTag
                ) => {

                    console.log(
                        'Mod tag scanned:',
                        modularTag
                    );


                    stopBarcodeScanner();


                    /*
                        Put the scanned Mod tag
                        into the search field.
                    */

                    if (
                        modularSearchInput
                    ) {

                        modularSearchInput.value =
                            modularTag;

                        modularSearchInput.focus();

                    }

                }
            );

        }
    );

}
/* =========================================================
   CLEAR ALL CONFIRMATION MODAL
========================================================= */

const modularClearButton =
	document.querySelector(
		'#modular-activity-clear'
	);


const modularClearModal =
	document.querySelector(
		'#modular-clear-modal'
	);


const modularClearModalCancel =
	document.querySelector(
		'#modular-clear-modal-cancel'
	);


const modularClearModalConfirm =
	document.querySelector(
		'#modular-clear-modal-confirm'
	);


const modularClearModalBackdrop =
	document.querySelector(
		'[data-clear-modal-close]'
	);


/* =========================================================
   OPEN CLEAR MODAL
========================================================= */

const openModularClearModal =
	() => {

		if (
			!modularClearModal
		) {

			return;

		}


		modularClearModal.hidden =
			false;


		lucide.createIcons();


		if (
			modularClearModalCancel
		) {

			modularClearModalCancel.focus();

		}

	};


/* =========================================================
   CLOSE CLEAR MODAL
========================================================= */

const closeModularClearModal =
	() => {

		if (
			!modularClearModal
		) {

			return;

		}


		modularClearModal.hidden =
			true;

	};

/* =========================================================
   ACTUALLY CLEAR ALL TAGS
========================================================= */

const clearAllModularTags =
	() => {

		/*
			Clear all temporary Mod Tag assignments.
		*/

		modularTagAssignments.length =
			0;


		/*
			Clear the displayed assignments.
		*/

		renderModularTagAssignments();


		/*
			Update counters.
		*/

		updateModularActivityCounters();


		/*
			Remove completion/check overlays
			from every bay.
		*/

		updateModularBayCompletionStates();


		/*
			Re-enable Mod Tag entry.
		*/

		if (
			modularSearchInput
		) {

			modularSearchInput.disabled =
				false;

			modularSearchInput.value =
				'';

			modularSearchInput.focus();

		}


		if (
			modularSearchButton
		) {

			modularSearchButton.disabled =
				false;

		}


		/*
			Clear any visible search error.
		*/

		if (
			modularSearchError
		) {

			modularSearchError.hidden =
				true;

			modularSearchError.textContent =
				'';

		}


		/*
			Clear any pending error timeout.
		*/

		if (
			modularSearchErrorTimeout
		) {

			clearTimeout(
				modularSearchErrorTimeout
			);

			modularSearchErrorTimeout =
				null;

		}


		console.log(
			'All temporary Mod Tag assignments cleared.'
		);

	};


/* =========================================================
   CLEAR BUTTON
========================================================= */

if (
	modularClearButton
) {

	modularClearButton.addEventListener(
		'click',
		() => {

			if (
				modularTagAssignments.length === 0
			) {

				return;

			}


			modularClearModalAction =
				'clear';


			if (
				modularClearModalTitle
			) {

				modularClearModalTitle.textContent =
					'Clear Scanned Tags?';

			}


			if (
				modularClearModalMessage
			) {

				modularClearModalMessage.textContent =
					'Are you sure you want to remove all scanned tags?';

			}


			if (
				modularClearModalConfirm
			) {

				modularClearModalConfirm.textContent =
					'Clear All';

			}


			openModularClearModal();

		}
	);

}
/* =========================================================
   END TASK BUTTON
========================================================= */

if (
	modularEndTaskButton
) {

	modularEndTaskButton.addEventListener(
		'click',
		() => {

			modularClearModalAction =
				'end';


			if (
				modularClearModalTitle
			) {

				modularClearModalTitle.textContent =
					'Cancel Modular Activity?';

			}


			if (
				modularClearModalMessage
			) {

				modularClearModalMessage.textContent =
					'Are you sure you want to cancel this Modular Activity? All progress will be lost';

			}


			if (
				modularClearModalConfirm
			) {

				modularClearModalConfirm.textContent =
					'End Task';

			}


			openModularClearModal();

		}
	);

}
/* =========================================================
   CANCEL
========================================================= */

if (
	modularClearModalCancel
) {

	modularClearModalCancel.addEventListener(
		'click',
		closeModularClearModal
	);

}


/* =========================================================
   BACKDROP CLICK
========================================================= */

if (
	modularClearModalBackdrop
) {

	modularClearModalBackdrop.addEventListener(
		'click',
		closeModularClearModal
	);

}


/* =========================================================
   CONFIRM
========================================================= */

if (
	modularClearModalConfirm
) {

	modularClearModalConfirm.addEventListener(
		'click',
		() => {

			if (
				modularClearModalAction === 'clear'
			) {

				clearAllModularTags();

			}


			if (
				modularClearModalAction === 'end'
			) {

				window.history.back();

			}


			closeModularClearModal();

		}
	);

}


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
	'keydown',
	event => {

		if (
			event.key === 'Escape' &&
			modularClearModal &&
			!modularClearModal.hidden
		) {

			closeModularClearModal();

		}

	}
);
/* =========================================================
   INITIALISE
========================================================= */

lucide.createIcons();


loadModularActivityBays();
