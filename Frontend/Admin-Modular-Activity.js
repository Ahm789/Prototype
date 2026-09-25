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


	const viewEditModularButton =
		document.getElementById(
			'view-edit-modular'
		);


	const modularView =
		document.getElementById(
			'modular-view'
		);


	const modularViewClose =
		document.getElementById(
			'modular-view-close'
		);


	const modularViewHeading =
		document.getElementById(
			'modular-view-heading'
		);


	const modularViewContent =
		document.getElementById(
			'modular-view-content'
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
	   GET MODULAR BAY PRODUCTS
	========================================================= */

	const getModularBayProducts =
		async (
			planogramNumber
		) => {

			const response =
				await fetch(
					`${API_ORIGIN}/api/products/modular-bay/${encodeURIComponent(
						planogramNumber
					)}`
				);


			if (
				!response.ok
			) {

				throw new Error(
					'Failed to load modular bay products.'
				);

			}


			const data =
				await response.json();


			if (
				!Array.isArray(data)
			) {

				throw new Error(
					'Invalid modular bay product response.'
				);

			}


			return data;

		};


	/* =========================================================
	   CREATE MODULAR BAY SNAPSHOT
	========================================================= */

/* =========================================================
   CREATE MODULAR BAY SNAPSHOT
========================================================= */

const createModularBaySnapshot =
	async (
		planogramNumber,
		targetBayId
	) => {

		const products =
			await getModularBayProducts(
				planogramNumber
			);


		if (
			!Array.isArray(products) ||
			!products.length
		) {

			return null;

		}


		/* =================================================
		   ONLY SELECTED BAY
		================================================= */

		const bayProducts =
			products.filter(
				product =>
					Number(
						product.bayId
					) ===
					Number(
						targetBayId
					)
			);


		if (
			!bayProducts.length
		) {

			return null;

		}


		/* =================================================
		   SHARED BAY DIMENSIONS
		================================================= */

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


		/* =================================================
		   LOAD IMAGE
		================================================= */

		const loadImage =
			(url) => {

				return new Promise(
					resolve => {

						if (
							!url
						) {

							resolve(
								null
							);

							return;

						}


						const image =
							new Image();


						image.crossOrigin =
							'anonymous';


						image.onload =
							() => {

								resolve(
									image
								);

							};


						image.onerror =
							() => {

								resolve(
									null
								);

							};


						image.src =
							url;

					}
				);

			};


		/* =================================================
		   CROP IMAGE TO NON-WHITE CONTENT
		================================================= */

		const cropImage =
			async (
				url
			) => {

				const image =
					await loadImage(
						url
					);


				if (
					!image ||
					!image.naturalWidth ||
					!image.naturalHeight
				) {

					return null;

				}


				const canvas =
					document.createElement(
						'canvas'
					);


				canvas.width =
					image.naturalWidth;


				canvas.height =
					image.naturalHeight;


				const context =
					canvas.getContext(
						'2d',
						{
							willReadFrequently:
								true
						}
					);


				context.drawImage(
					image,
					0,
					0
				);


				let imageData;


				try {

					imageData =
						context.getImageData(
							0,
							0,
							canvas.width,
							canvas.height
						);

				}
				catch {

					return image;

				}


				const data =
					imageData.data;


				let minX =
					canvas.width;


				let minY =
					canvas.height;


				let maxX =
					-1;


				let maxY =
					-1;


				for (
					let y = 0;
					y < canvas.height;
					y++
				) {

					for (
						let x = 0;
						x < canvas.width;
						x++
					) {

						const index =
							(
								y *
								canvas.width +
								x
							) *
							4;


						const red =
							data[index];


						const green =
							data[index + 1];


						const blue =
							data[index + 2];


						const alpha =
							data[index + 3];


						const isWhite =
							alpha === 0 ||
							(
								red >= 245 &&
								green >= 245 &&
								blue >= 245
							);


						if (
							!isWhite
						) {

							minX =
								Math.min(
									minX,
									x
								);


							minY =
								Math.min(
									minY,
									y
								);


							maxX =
								Math.max(
									maxX,
									x
								);


							maxY =
								Math.max(
									maxY,
									y
								);

						}

					}

				}


				if (
					maxX < 0 ||
					maxY < 0
				) {

					return image;

				}


				minX =
					Math.max(
						0,
						minX -
						cropPadding
					);


				minY =
					Math.max(
						0,
						minY -
						cropPadding
					);


				maxX =
					Math.min(
						canvas.width - 1,
						maxX +
						cropPadding
					);


				maxY =
					Math.min(
						canvas.height - 1,
						maxY +
						cropPadding
					);


				const croppedWidth =
					maxX -
					minX +
					1;


				const croppedHeight =
					maxY -
					minY +
					1;


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
					minX,
					minY,
					croppedWidth,
					croppedHeight,
					0,
					0,
					croppedWidth,
					croppedHeight
				);


				return croppedCanvas;

			};


		/* =================================================
		   GROUP PRODUCTS BY SHELF
		================================================= */

		const shelves =
			new Map();


		bayProducts.forEach(
			product => {

				const shelf =
					String(
						product.shelf ||
						''
					).trim();


				if (
					!shelves.has(
						shelf
					)
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
		   SORT SHELVES
		================================================= */

		const shelfEntries =
			[
				...shelves.entries()
			].sort(
				(
					a,
					b
				) => {

					const shelfA =
						parseInt(
							String(
								a[0]
							).replace(
								/\D/g,
								''
							),
							10
						) || 0;


					const shelfB =
						parseInt(
							String(
								b[0]
							).replace(
								/\D/g,
								''
							),
							10
						) || 0;


					return (
						shelfA -
						shelfB
					);

				}
			);


		/* =================================================
		   PREPARE PRODUCT IMAGES
		================================================= */

		const preparedShelves =
			[];


		for (
			const [
				shelfName,
				shelfProducts
			]
			of shelfEntries
		) {

			shelfProducts.sort(
				(
					a,
					b
				) => {

					return (
						Number(
							a.shelfOrder
						) || 0
					) -
					(
						Number(
							b.shelfOrder
						) || 0
					);

				}
			);


			const preparedProducts =
				[];


			for (
				const product
				of shelfProducts
			) {

				const imageUrl =
					product.image?.url;


				const croppedImage =
					await cropImage(
						imageUrl
					);


				preparedProducts.push({
					product,
					croppedImage
				});

			}


			preparedShelves.push({
				shelfName,
				products:
					preparedProducts
			});

		}


		/* =================================================
		   CREATE OFFSCREEN VISUAL
		================================================= */

		const visual =
			document.createElement(
				'div'
			);


		visual.className =
			'modular-visual';


		visual.style.position =
			'fixed';


		visual.style.left =
			'-100000px';


		visual.style.top =
			'0';


		visual.style.width =
			`${bayWidth}px`;


		visual.style.background =
			'#ffffff';


		visual.style.boxSizing =
			'border-box';


		visual.style.padding =
			'0';


		visual.style.margin =
			'0';


		document.body.appendChild(
			visual
		);


		try {

			/* =================================================
			   BUILD SHELVES
			================================================= */

			for (
				let shelfIndex = 0;
				shelfIndex < preparedShelves.length;
				shelfIndex++
			) {

				const shelf =
					preparedShelves[
						shelfIndex
					];


				const shelfElement =
					document.createElement(
						'div'
					);


				shelfElement.style.position =
					'relative';


				shelfElement.style.width =
					`${bayWidth}px`;


				shelfElement.style.height =
					`${shelfHeight}px`;


				shelfElement.style.boxSizing =
					'border-box';


				shelfElement.style.overflow =
					'hidden';


				shelfElement.style.background =
					'#ffffff';


				/* =========================================
				   PRODUCT ROW
				========================================= */

				const productRow =
					document.createElement(
						'div'
					);


				productRow.style.position =
                    'relative';


                productRow.style.display =
                    'flex';


                productRow.style.alignItems =
                    'flex-end';


                productRow.style.gap =
                    `${gap}px`;


                productRow.style.width =
                    'max-content';


                productRow.style.height =
                    `${shelfHeight}px`;


                productRow.style.boxSizing =
                    'border-box';


                productRow.style.paddingLeft =
                    '12px';


                productRow.style.paddingRight =
                    '12px';


                productRow.style.background =
                    '#ffffff';


                productRow.style.marginLeft =
                    'auto';


                productRow.style.marginRight =
                    'auto';


				/* =========================================
				   ADD PRODUCTS
				========================================= */

				for (
					const preparedProduct
					of shelf.products
				) {

					const product =
						preparedProduct.product;


					const croppedImage =
						preparedProduct.croppedImage;


					const facings =
						Math.max(
							1,
							Number(
								product.facings
							) || 1
						);


					const productWrapper =
						document.createElement(
							'div'
						);


					productWrapper.style.display =
						'flex';


					productWrapper.style.alignItems =
						'flex-end';


					productWrapper.style.flexShrink =
						'0';


					productWrapper.style.height =
						`${shelfHeight}px`;


					if (
						croppedImage
					) {

						const aspectRatio =
							croppedImage.width /
							croppedImage.height;


						const imageWidth =
							Math.max(
								1,
								Math.round(
									shelfHeight *
									aspectRatio
								)
							);


						for (
							let facing = 0;
							facing < facings;
							facing++
						) {

							const image =
								document.createElement(
									'img'
								);


							image.src =
								croppedImage.toDataURL(
									'image/png'
								);


							image.alt =
								'';


							image.style.display =
								'block';


							image.style.width =
								`${imageWidth}px`;


							image.style.height =
								`${shelfHeight}px`;


							image.style.objectFit =
								'contain';


							image.style.objectPosition =
								'bottom';


							image.style.flexShrink =
								'0';


							productWrapper.appendChild(
								image
							);

						}

					}
					else {

						for (
							let facing = 0;
							facing < facings;
							facing++
						) {

							const placeholder =
								document.createElement(
									'div'
								);


							placeholder.style.width =
								`${shelfHeight}px`;


							placeholder.style.height =
								`${shelfHeight}px`;


							placeholder.style.flexShrink =
								'0';


							placeholder.style.background =
								'#ffffff';


							productWrapper.appendChild(
								placeholder
							);

						}

					}


					productRow.appendChild(
						productWrapper
					);

				}


				/* =========================================
				   GET SHELF CONTENT WIDTH
				========================================= */

				const contentWidth =
					productRow.scrollWidth;


				/* =========================================
				   ADD SHELF SEPARATOR
				========================================= */

				if (
					shelfIndex <
					preparedShelves.length - 1
				) {

					const separator =
						document.createElement(
							'div'
						);


					separator.style.position =
						'absolute';


					separator.style.left =
						'0';


					separator.style.bottom =
						'0';


					separator.style.width =
						'100%';


					separator.style.height =
						'2px';


					separator.style.background =
						'#c5d0d1';


					separator.style.pointerEvents =
						'none';


					productRow.appendChild(
						separator
					);

				}


				/* =========================================
				   SCALE SHELF IF TOO WIDE
				========================================= */

				if (
					contentWidth >
					bayWidth
				) {

					const scale =
						bayWidth /
						contentWidth;


					productRow.style.transformOrigin =
						'left bottom';


					productRow.style.transform =
						`scaleX(${scale})`;

				}


				shelfElement.appendChild(
					productRow
				);


				visual.appendChild(
					shelfElement
				);

			}


			/* =================================================
			   ENSURE MINIMUM HEIGHT
			================================================= */

			const currentHeight =
				visual.scrollHeight;


			if (
				currentHeight <
				minimumBayHeight
			) {

				visual.style.height =
					`${minimumBayHeight}px`;

			}


			/* =================================================
			   WAIT FOR RENDER
			================================================= */

			await new Promise(
				resolve =>
					requestAnimationFrame(
						() => {

							requestAnimationFrame(
								resolve
							);

						}
					)
			);


			if (
				typeof html2canvas !==
				'function'
			) {

				throw new Error(
					'html2canvas is not available.'
				);

			}


			/* =================================================
			   CREATE CANVAS
			================================================= */

			const canvas =
				await html2canvas(
					visual,
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
							Math.max(
								minimumBayHeight,
								visual.scrollHeight
							),

						logging:
							false
					}
				);


			/* =================================================
			   CROP HORIZONTAL + VERTICAL WHITE SPACE
			================================================= */

			const context =
				canvas.getContext(
					'2d',
					{
						willReadFrequently:
							true
					}
				);


			const imageData =
				context.getImageData(
					0,
					0,
					canvas.width,
					canvas.height
				);


			const pixels =
				imageData.data;


			let minX =
				canvas.width;


			let maxX =
				-1;


			let minY =
				canvas.height;


			let maxY =
				-1;


			for (
				let y = 0;
				y < canvas.height;
				y++
			) {

				for (
					let x = 0;
					x < canvas.width;
					x++
				) {

					const index =
						(
							y *
							canvas.width +
							x
						) *
						4;


					const red =
						pixels[index];


					const green =
						pixels[index + 1];


					const blue =
						pixels[index + 2];


					const alpha =
						pixels[index + 3];


					const isWhite =
						alpha === 0 ||
						(
							red >= 248 &&
							green >= 248 &&
							blue >= 248
						);


					if (
						!isWhite
					) {

						minX =
							Math.min(
								minX,
								x
							);


						maxX =
							Math.max(
								maxX,
								x
							);


						minY =
							Math.min(
								minY,
								y
							);


						maxY =
							Math.max(
								maxY,
								y
							);

					}

				}

			}


			let finalCanvas =
				canvas;


			if (
				maxX >= 0 &&
				maxY >= 0
			) {

				const cropCanvas =
					document.createElement(
						'canvas'
					);


				cropCanvas.width =
					maxX -
					minX +
					1;


				cropCanvas.height =
					maxY -
					minY +
					1;


				const cropContext =
					cropCanvas.getContext(
						'2d'
					);


				cropContext.drawImage(
					canvas,
					minX,
					minY,
					cropCanvas.width,
					cropCanvas.height,
					0,
					0,
					cropCanvas.width,
					cropCanvas.height
				);


				finalCanvas =
					cropCanvas;

			}


			/* =================================================
			   RETURN SNAPSHOT
			================================================= */

			const bayNumber =
				bayProducts[0]?.bayNumber ??
				'';


			return {
				bayNumber,

				snapshot:
					finalCanvas.toDataURL(
						'image/png'
					)
			};

		}
		finally {

			visual.remove();

		}

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


			if (
				viewEditModularButton
			) {

				viewEditModularButton.disabled =
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


			if (
				viewEditModularButton
			) {

				viewEditModularButton.disabled =
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


			if (
				viewEditModularButton
			) {

				viewEditModularButton.disabled =
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
				behavior:
					'smooth',

				block:
					'nearest'
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
   OPEN MODULAR VIEW
========================================================= */

if (viewEditModularButton) {

	viewEditModularButton.addEventListener(
		'click',
		async () => {

			if (
				!editingBayId ||
				!modularView
			) {

				return;

			}


			const bayNumber =
				bayNumberInput
					? bayNumberInput.value
					: '';


			const modularId =
				bayModularIdInput
					? bayModularIdInput.value
					: '';


			const currentPlanogramNumber =
				selectedPlanogramNumber;


			if (
				!currentPlanogramNumber
			) {

				return;

			}


			modularView.hidden = false;


			modularViewHeading.textContent =
				`Bay ${bayNumber}`;


			modularViewContent.innerHTML = `
				<div class="modular-view-loading">
					Loading bay...
				</div>
			`;


			/* =================================================
			   STATE
			================================================= */

			let currentItems = [];

			let selectedSearchProduct = null;

			let editingModularItemId = null;


			/* =================================================
			   LOAD BAY DATA
			================================================= */

			const loadBayItems =
				async () => {

					const items =
						await getModularBayProducts(
							currentPlanogramNumber
						);


					return items
						.filter(
							item =>
								Number(item.bayId) ===
								Number(editingBayId)
						)
						.sort(
							(a, b) => {

								const shelfA =
									parseInt(
										String(
											a.shelf || ''
										).replace(
											/[^0-9]/g,
											''
										),
										10
									) || 0;


								const shelfB =
									parseInt(
										String(
											b.shelf || ''
										).replace(
											/[^0-9]/g,
											''
										),
										10
									) || 0;


								if (
									shelfA !== shelfB
								) {

									return shelfA - shelfB;

								}


								return (
									Number(
										a.shelfOrder
									) || 0
								) -
								(
									Number(
										b.shelfOrder
									) || 0
								);

							}
						);

				};


			/* =================================================
			   REFRESH BAY IMAGE
			================================================= */

			const refreshBayImage =
				async () => {

					const refreshButton =
						document.getElementById(
							'modular-view-refresh-image'
						);


					if (
						refreshButton
					) {

						refreshButton.disabled =
							true;

						refreshButton.textContent =
							'Refreshing...';

					}


					try {

						const snapshot =
							await createModularBaySnapshot(
								currentPlanogramNumber,
								editingBayId
							);


						const image =
							document.getElementById(
								'modular-view-bay-image'
							);


						const emptyState =
							document.getElementById(
								'modular-view-bay-image-empty'
							);


						if (
							snapshot &&
							snapshot.snapshot
						) {

							if (image) {

								image.src =
									snapshot.snapshot;

								image.hidden =
									false;

							}


							if (emptyState) {

								emptyState.hidden =
									true;

							}

						} else {

							if (image) {

								image.hidden =
									true;

							}


							if (emptyState) {

								emptyState.hidden =
									false;

							}

						}


					} finally {

						if (
							refreshButton
						) {

							refreshButton.disabled =
								false;

							refreshButton.textContent =
								'Refresh image';

						}

					}

				};


			/* =================================================
			   SEARCH PRODUCTS
			================================================= */

			const searchProducts =
				async query => {

					const cleanQuery =
						String(
							query || ''
						).trim();


					if (
						cleanQuery.length < 2
					) {

						return [];

					}


					const response =
						await fetch(
							`${API_BASE}/bay-items/search?q=${encodeURIComponent(cleanQuery)}`
						);


					if (
						!response.ok
					) {

						let errorMessage =
							'Failed to search products.';


						try {

							const data =
								await response.json();


							if (
								data &&
								data.error
							) {

								errorMessage =
									data.error;

							}

						} catch (
							error
						) {}


						throw new Error(
							errorMessage
						);

					}


					const data =
						await response.json();


					return Array.isArray(data)
						? data
						: [];

				};


			/* =================================================
			   RENDER VIEW
			================================================= */

			const renderView =
				async () => {

					currentItems =
						await loadBayItems();


					const snapshot =
						await createModularBaySnapshot(
							currentPlanogramNumber,
							editingBayId
						);


					const imageHtml =
						snapshot &&
						snapshot.snapshot
							? `
								<img
									id="modular-view-bay-image"
									class="modular-view-bay-image"
									src="${escapeHtml(snapshot.snapshot)}"
									alt="Bay ${escapeHtml(String(bayNumber))}"
								>

								<div
									id="modular-view-bay-image-empty"
									hidden
								>
									No bay image available.
								</div>
							`
							: `
								<img
									id="modular-view-bay-image"
									class="modular-view-bay-image"
									alt="Bay ${escapeHtml(String(bayNumber))}"
									hidden
								>

								<div
									id="modular-view-bay-image-empty"
								>
									No bay image available.
								</div>
							`;


					const rows =
						currentItems.length
							? currentItems
								.map(
									item => `
										<tr
											class="modular-item-table-row"
											data-modular-item-id="${escapeHtml(String(item.modularItemId))}"
											tabindex="0"
											role="button"
											aria-label="Edit ${escapeHtml(item.description || item.upc || 'product')}"
										>

											<td>
												<div class="modular-item-row-main">
													<strong>
														${escapeHtml(item.description || 'Unknown product')}
													</strong>

													<span>
														UPC ${escapeHtml(String(item.upc || ''))}
													</span>
												</div>
											</td>

											<td>
												${escapeHtml(String(item.itemId || ''))}
											</td>

											<td>
												${
													item.image &&
													item.image.url
														? `
															<img
																class="modular-item-table-image"
																src="${escapeHtml(item.image.url)}"
																alt="${escapeHtml(item.image.alt || item.description || '')}"
															>
														`
														: `
															<span class="modular-item-no-image">
																No image
															</span>
														`
												}
											</td>

											<td>
												${escapeHtml(String(item.shelf || ''))}
											</td>

											<td>
												${escapeHtml(String(item.shelfOrder || ''))}
											</td>

											<td>
												${escapeHtml(String(item.facings || ''))}
											</td>

											<td>
												<button
													type="button"
													class="modular-item-delete-button"
													data-delete-modular-item-id="${escapeHtml(String(item.modularItemId))}"
													aria-label="Delete ${escapeHtml(item.description || item.upc || 'product')}"
												>
													Delete
												</button>
											</td>

										</tr>
									`
								)
								.join('')
							: `
								<tr>
									<td
										colspan="7"
										class="modular-view-empty-table"
									>
										No products are assigned to this bay.
									</td>
								</tr>
							`;


					modularViewContent.innerHTML = `

						<div class="modular-view-toolbar">

							<div>
								<span class="eyebrow">
									MODULAR / BAY
								</span>

								<h2>
									Bay ${escapeHtml(String(bayNumber))}
								</h2>

								<p>
									Modular:
									<strong>
										${escapeHtml(String(modularId || 'Not assigned'))}
									</strong>
								</p>
							</div>

							<div class="modular-view-toolbar-actions">

								<button
									type="button"
									id="modular-view-refresh-image"
									class="modular-view-action-button"
								>
									Refresh image
								</button>

							</div>

						</div>


						<!-- =================================================
						     BAY IMAGE
						================================================= -->

						<section class="modular-view-section">

							<div class="modular-view-section-heading">

								<div>

									<span class="eyebrow">
										BAY IMAGE
									</span>

									<h2>
										Current layout
									</h2>

								</div>

								<span class="modular-view-item-count">
									${currentItems.length}
									${currentItems.length === 1 ? 'item' : 'items'}
								</span>

							</div>


							<div class="modular-view-bay-image-container">

								${imageHtml}

							</div>

						</section>


						<!-- =================================================
						     ADD ITEM
						================================================= -->

						<section class="modular-view-section modular-view-add-item-section">

							<div class="modular-view-section-heading">

								<div>

									<span class="eyebrow">
										ADD ITEM
									</span>

									<h2>
										Add product to bay
									</h2>

								</div>

							</div>


							<div class="modular-item-editor">

								<div class="modular-item-search">

									<label
										for="modular-item-search-input"
									>
										Search product
									</label>

									<input
										type="search"
										id="modular-item-search-input"
										placeholder="Search by UPC, barcode or description..."
										autocomplete="off"
									>

									<div
										id="modular-item-search-results"
										class="modular-item-search-results"
									></div>

								</div>


								<div
									id="modular-item-selected"
									class="modular-item-selected"
									hidden
								>

									<div
										id="modular-item-selected-image-container"
										class="modular-item-selected-image-container"
									></div>

									<div class="modular-item-selected-details">

										<span class="eyebrow">
											SELECTED PRODUCT
										</span>

										<strong
											id="modular-item-selected-description"
										></strong>

										<span
											id="modular-item-selected-upc"
										></span>

									</div>

								</div>


								<div class="modular-item-fields">

									<div class="modular-item-field">

										<label
											for="modular-item-shelf"
										>
											Shelf
										</label>

										<input
											type="text"
											id="modular-item-shelf"
											placeholder="e.g. 1"
										>

									</div>


									<div class="modular-item-field">

										<label
											for="modular-item-shelf-order"
										>
											Shelf order
										</label>

										<input
											type="number"
											id="modular-item-shelf-order"
											min="1"
											step="1"
											placeholder="1"
										>

									</div>


									<div class="modular-item-field">

										<label
											for="modular-item-max-shelf"
										>
											Max shelf
										</label>

										<input
											type="number"
											id="modular-item-max-shelf"
											min="0"
											step="1"
											placeholder="0"
										>

									</div>


									<div class="modular-item-field">

										<label
											for="modular-item-facings"
										>
											Facings
										</label>

										<input
											type="number"
											id="modular-item-facings"
											min="1"
											step="1"
											placeholder="1"
										>

									</div>

								</div>


								<div
									id="modular-item-form-message"
									class="modular-item-form-message"
									hidden
								></div>


								<div class="modular-item-editor-actions">

									<button
										type="button"
										id="modular-item-add-button"
										class="modular-view-primary-button"
										disabled
									>
										Add item
									</button>

								</div>

							</div>

						</section>


						<!-- =================================================
						     PRODUCTS
						================================================= -->

						<section class="modular-view-section">

							<div class="modular-view-section-heading">

								<div>

									<span class="eyebrow">
										BAY CONTENT
									</span>

									<h2>
										Products
									</h2>

								</div>

							</div>


							<div class="modular-view-table-container">

								<table class="modular-view-products-table">

									<thead>

										<tr>
											<th>Product</th>
											<th>Item ID</th>
											<th>Image</th>
											<th>Shelf</th>
											<th>Order</th>
											<th>Facings</th>
											<th></th>
										</tr>

									</thead>

									<tbody>

										${rows}

									</tbody>

								</table>

							</div>

						</section>

					`;


					/* =================================================
					   DOM REFERENCES
					================================================= */

					const refreshButton =
						document.getElementById(
							'modular-view-refresh-image'
						);


					const searchInput =
						document.getElementById(
							'modular-item-search-input'
						);


					const searchResults =
						document.getElementById(
							'modular-item-search-results'
						);


					const selectedProductPanel =
						document.getElementById(
							'modular-item-selected'
						);


					const selectedProductImageContainer =
						document.getElementById(
							'modular-item-selected-image-container'
						);


					const selectedProductDescription =
						document.getElementById(
							'modular-item-selected-description'
						);


					const selectedProductUpc =
						document.getElementById(
							'modular-item-selected-upc'
						);


					const shelfInput =
						document.getElementById(
							'modular-item-shelf'
						);


					const shelfOrderInput =
						document.getElementById(
							'modular-item-shelf-order'
						);


					const maxShelfInput =
						document.getElementById(
							'modular-item-max-shelf'
						);


					const facingsInput =
						document.getElementById(
							'modular-item-facings'
						);


					const addButton =
						document.getElementById(
							'modular-item-add-button'
						);


					const formMessage =
						document.getElementById(
							'modular-item-form-message'
						);


					/* =================================================
					   REFRESH IMAGE
					================================================= */

					if (
						refreshButton
					) {

						refreshButton.addEventListener(
							'click',
							async () => {

								try {

									await refreshBayImage();

								} catch (error) {

									console.error(
										'Failed to refresh bay image:',
										error
									);

									alert(
										error.message ||
										'Failed to refresh bay image.'
									);

								}

							}
						);

					}


					/* =================================================
					   SELECT SEARCH PRODUCT
					================================================= */

					const selectSearchProduct =
						product => {

							selectedSearchProduct =
								product;


							editingModularItemId =
								null;


							if (
								selectedProductPanel
							) {

								selectedProductPanel.hidden =
									false;

							}


							if (
								selectedProductDescription
							) {

								selectedProductDescription.textContent =
									product.description ||
									'Unknown product';

							}


							if (
								selectedProductUpc
							) {

								selectedProductUpc.textContent =
									`UPC ${product.upc || ''}`;

							}


							if (
								selectedProductImageContainer
							) {

								if (
									product.image &&
									product.image.url
								) {

									selectedProductImageContainer.innerHTML = `
										<img
											src="${escapeHtml(product.image.url)}"
											alt="${escapeHtml(product.image.alt || product.description || '')}"
										>
									`;

								} else {

									selectedProductImageContainer.innerHTML = `
										<span>
											No image
										</span>
									`;

								}

							}


							if (
								maxShelfInput
							) {

								maxShelfInput.value =
									Number.isFinite(
										Number(
											product.maxShelf
										)
									)
										? Number(
											product.maxShelf
										)
										: 0;

							}


							if (
								shelfOrderInput
							) {

								shelfOrderInput.value =
									1;

							}


							if (
								facingsInput
							) {

								facingsInput.value =
									1;

							}


							if (
								addButton
							) {

								addButton.disabled =
									false;

								addButton.textContent =
									'Add item';

							}


							if (
								searchInput
							) {

								searchInput.value =
									product.description ||
									product.upc ||
									'';

							}


							if (
								searchResults
							) {

								searchResults.innerHTML =
									'';

							}


							if (
								formMessage
							) {

								formMessage.hidden =
									true;

							}

						};


					/* =================================================
					   SEARCH INPUT
					================================================= */

					let searchTimer = null;


					if (
						searchInput
					) {

						searchInput.addEventListener(
							'input',
							() => {

								clearTimeout(
									searchTimer
								);


								selectedSearchProduct =
									null;


								if (
									addButton
								) {

									addButton.disabled =
										true;

								}


								const query =
									searchInput.value.trim();


								if (
									searchResults
								) {

									searchResults.innerHTML =
										'';

								}


								if (
									query.length < 2
								) {

									return;

								}


								searchTimer =
									setTimeout(
										async () => {

											try {

												if (
													searchResults
												) {

													searchResults.innerHTML = `
														<div class="modular-item-search-loading">
															Searching...
														</div>
													`;

												}


												const results =
													await searchProducts(
														query
													);


												if (
													!results.length
												) {

													searchResults.innerHTML = `
														<div class="modular-item-search-empty">
															No products found.
														</div>
													`;

													return;

												}


												searchResults.innerHTML =
													results
														.map(
															product => `
																<button
																	type="button"
																	class="modular-item-search-result"
																	data-search-item-id="${escapeHtml(String(product.itemId))}"
																>

																	${
																		product.image &&
																		product.image.url
																			? `
																				<img
																					src="${escapeHtml(product.image.url)}"
																					alt="${escapeHtml(product.image.alt || product.description || '')}"
																				>
																			`
																			: `
																				<div class="modular-item-search-result-no-image">
																					No image
																				</div>
																			`
																	}

																	<span class="modular-item-search-result-details">

																		<strong>
																			${escapeHtml(product.description || 'Unknown product')}
																		</strong>

																		<span>
																			UPC ${escapeHtml(String(product.upc || ''))}
																		</span>

																	</span>

																</button>
															`
														)
														.join('');


												searchResults
													.querySelectorAll(
														'[data-search-item-id]'
													)
													.forEach(
														button => {

															button.addEventListener(
																'click',
																() => {

																	const product =
																		results.find(
																			item =>
																				String(
																					item.itemId
																				) ===
																				String(
																					button.dataset.searchItemId
																				)
																		);


																	if (
																		product
																	) {

																		selectSearchProduct(
																			product
																		);

																	}

																}
															);

														}
													);


											} catch (error) {

												console.error(
													'Failed to search products:',
													error
												);


												if (
													searchResults
												) {

													searchResults.innerHTML = `
														<div class="modular-item-search-error">
															${escapeHtml(error.message || 'Search failed.')}
														</div>
													`;

												}

											}

										},
										250
									);

							}
						);

					}


					/* =================================================
					   ADD ITEM
					================================================= */

					if (
						addButton
					) {

						addButton.addEventListener(
							'click',
							async () => {

								if (
									!selectedSearchProduct
								) {

									return;

								}


								const shelf =
									shelfInput
										? shelfInput.value.trim()
										: '';


								const shelfOrder =
									shelfOrderInput
										? Number(
											shelfOrderInput.value
										)
										: NaN;


								const maxShelf =
									maxShelfInput
										? Number(
											maxShelfInput.value
										)
										: NaN;


								const facings =
									facingsInput
										? Number(
											facingsInput.value
										)
										: NaN;


								if (
									!shelf
								) {

									formMessage.textContent =
										'Shelf is required.';

									formMessage.hidden =
										false;

									return;

								}


								if (
									!Number.isInteger(
										shelfOrder
									) ||
									shelfOrder < 1
								) {

									formMessage.textContent =
										'Shelf order must be a valid whole number starting from 1.';

									formMessage.hidden =
										false;

									return;

								}


								if (
									!Number.isInteger(
										maxShelf
									) ||
									maxShelf < 0
								) {

									formMessage.textContent =
										'Max shelf must be a valid whole number.';

									formMessage.hidden =
										false;

									return;

								}


								if (
									!Number.isInteger(
										facings
									) ||
									facings < 1
								) {

									formMessage.textContent =
										'Facings must be at least 1.';

									formMessage.hidden =
										false;

									return;

								}


								addButton.disabled =
									true;

								addButton.textContent =
									'Adding...';


								try {

									await apiRequest(
										`${API_BASE}/bays/${encodeURIComponent(editingBayId)}/items`,
										{
											method:
												'POST',

											headers: {
												'Content-Type':
													'application/json'
											},

											body:
												JSON.stringify({
													itemId:
														Number(
															selectedSearchProduct.itemId
														),

													shelf:
														shelf,

													shelfOrder:
														shelfOrder,

													maxShelf:
														maxShelf,

													facings:
														facings
												})
										}
									);


									await renderView();


								} catch (error) {

									console.error(
										'Failed to add modular item:',
										error
									);


									if (
										formMessage
									) {

										formMessage.textContent =
											error.message ||
											'Failed to add item.';

										formMessage.hidden =
											false;

									}


									addButton.disabled =
										false;

									addButton.textContent =
										'Add item';

								}

							}
						);

					}


					/* =================================================
					   EDIT EXISTING ITEM
					================================================= */

					const openEditor =
						itemId => {

							const item =
								currentItems.find(
									currentItem =>
										String(
											currentItem.modularItemId
										) ===
										String(
											itemId
										)
								);


							if (
								!item
							) {

								return;

							}


							editingModularItemId =
								item.modularItemId;


							selectedSearchProduct =
								null;


							if (
								selectedProductPanel
							) {

								selectedProductPanel.hidden =
									false;

							}


							if (
								selectedProductDescription
							) {

								selectedProductDescription.textContent =
									item.description ||
									'Unknown product';

							}


							if (
								selectedProductUpc
							) {

								selectedProductUpc.textContent =
									`UPC ${item.upc || ''}`;

							}


							if (
								selectedProductImageContainer
							) {

								if (
									item.image &&
									item.image.url
								) {

									selectedProductImageContainer.innerHTML = `
										<img
											src="${escapeHtml(item.image.url)}"
											alt="${escapeHtml(item.image.alt || item.description || '')}"
										>
									`;

								} else {

									selectedProductImageContainer.innerHTML = `
										<span>
											No image
										</span>
									`;

								}

							}


							if (
								searchInput
							) {

								searchInput.value =
									item.description ||
									item.upc ||
									'';

								searchInput.disabled =
									true;

							}


							if (
								shelfInput
							) {

								shelfInput.value =
									item.shelf || '';

							}


							if (
								shelfOrderInput
							) {

								shelfOrderInput.value =
									Number(
										item.shelfOrder
									) || 1;

							}


							if (
								maxShelfInput
							) {

								maxShelfInput.value =
									Number(
										item.maxShelf
									) || 0;

							}


							if (
								facingsInput
							) {

								facingsInput.value =
									Number(
										item.facings
									) || 1;

							}


							if (
								addButton
							) {

								addButton.disabled =
									false;

								addButton.textContent =
									'Save changes';

							}


							if (
								formMessage
							) {

								formMessage.hidden =
									true;

							}

						};


					/* =================================================
					   CANCEL EDIT / RETURN TO ADD MODE
					================================================= */

					const resetEditor =
						() => {

							editingModularItemId =
								null;

							selectedSearchProduct =
								null;


							if (
								searchInput
							) {

								searchInput.disabled =
									false;

								searchInput.value =
									'';

							}


							if (
								selectedProductPanel
							) {

								selectedProductPanel.hidden =
									true;

							}


							if (
								shelfInput
							) {

								shelfInput.value =
									'';

							}


							if (
								shelfOrderInput
							) {

								shelfOrderInput.value =
									'1';

							}


							if (
								maxShelfInput
							) {

								maxShelfInput.value =
									'';

							}


							if (
								facingsInput
							) {

								facingsInput.value =
									'1';

							}


							if (
								addButton
							) {

								addButton.disabled =
									true;

								addButton.textContent =
									'Add item';

							}


							if (
								formMessage
							) {

								formMessage.hidden =
									true;

							}

						};


					/* =================================================
					   SAVE EDIT
					================================================= */

					if (
						addButton
					) {

						addButton.addEventListener(
							'click',
							async () => {

								if (
									!editingModularItemId
								) {

									return;

								}


								const shelf =
									shelfInput
										? shelfInput.value.trim()
										: '';


								const shelfOrder =
									shelfOrderInput
										? Number(
											shelfOrderInput.value
										)
										: NaN;


								const maxShelf =
									maxShelfInput
										? Number(
											maxShelfInput.value
										)
										: NaN;


								const facings =
									facingsInput
										? Number(
											facingsInput.value
										)
										: NaN;


								if (
									!shelf
								) {

									formMessage.textContent =
										'Shelf is required.';

									formMessage.hidden =
										false;

									return;

								}


								if (
									!Number.isInteger(
										shelfOrder
									) ||
									shelfOrder < 1
								) {

									formMessage.textContent =
										'Shelf order must be a valid whole number starting from 1.';

									formMessage.hidden =
										false;

									return;

								}


								if (
									!Number.isInteger(
										maxShelf
									) ||
									maxShelf < 0
								) {

									formMessage.textContent =
										'Max shelf must be a valid whole number.';

									formMessage.hidden =
										false;

									return;

								}


								if (
									!Number.isInteger(
										facings
									) ||
									facings < 1
								) {

									formMessage.textContent =
										'Facings must be at least 1.';

									formMessage.hidden =
										false;

									return;

								}


								addButton.disabled =
									true;

								addButton.textContent =
									'Saving...';


								try {

									await apiRequest(
										`${API_BASE}/bay-items/${encodeURIComponent(editingModularItemId)}`,
										{
											method:
												'PUT',

											headers: {
												'Content-Type':
													'application/json'
											},

											body:
												JSON.stringify({
													shelf:
														shelf,

													shelfOrder:
														shelfOrder,

													maxShelf:
														maxShelf,

													facings:
														facings
												})
										}
									);


									await renderView();


								} catch (error) {

									console.error(
										'Failed to update modular item:',
										error
									);


									formMessage.textContent =
										error.message ||
										'Failed to save changes.';

									formMessage.hidden =
										false;


									addButton.disabled =
										false;

									addButton.textContent =
										'Save changes';

								}

							}
						);

					}


					/* =================================================
					   TABLE ROWS
					================================================= */

					modularViewContent
						.querySelectorAll(
							'.modular-item-table-row'
						)
						.forEach(
							row => {

								const rowItemId =
									row.dataset.modularItemId;


								row.addEventListener(
									'click',
									event => {

										if (
											event.target.closest(
												'.modular-item-delete-button'
											)
										) {

											return;

										}


										openEditor(
											rowItemId
										);

									}
								);


								row.addEventListener(
									'keydown',
									event => {

										if (
											event.key === 'Enter' ||
											event.key === ' '
										) {

											event.preventDefault();


											openEditor(
												rowItemId
											);

										}

									}
								);

							}
						);


					/* =================================================
					   DELETE BUTTONS
					================================================= */

					modularViewContent
						.querySelectorAll(
							'[data-delete-modular-item-id]'
						)
						.forEach(
							button => {

								button.addEventListener(
									'click',
									async event => {

										event.stopPropagation();


										const itemId =
											button.dataset
												.deleteModularItemId;


										const item =
											currentItems.find(
												currentItem =>
													String(
														currentItem.modularItemId
													) ===
													String(
														itemId
													)
											);


										const productName =
											item &&
											item.description
												? item.description
												: 'this product';


										if (
											!window.confirm(
												`Delete ${productName} from this bay?`
											)
										) {

											return;

										}


										button.disabled =
											true;

										button.textContent =
											'Deleting...';


										try {

											await apiRequest(
												`${API_BASE}/bay-items/${encodeURIComponent(itemId)}`,
												{
													method:
														'DELETE'
												}
											);


											await renderView();


										} catch (error) {

											console.error(
												'Failed to delete modular item:',
												error
											);


											alert(
												error.message ||
												'Failed to delete item.'
											);


											button.disabled =
												false;

											button.textContent =
												'Delete';

										}

									}
								);

							}
						);


					/* =================================================
					   EDITOR MODE
					================================================= */

					/*
						Clicking an existing row turns the
						Add Item editor into an Edit Item
						editor.

						A small cancel button is added
						here so the user can return to
						Add Item mode.
					*/

					if (
						addButton &&
						!document.getElementById(
							'modular-item-cancel-button'
						)
					) {

						const cancelButton =
							document.createElement(
								'button'
							);


						cancelButton.type =
							'button';


						cancelButton.id =
							'modular-item-cancel-button';


						cancelButton.className =
							'modular-view-secondary-button';


						cancelButton.textContent =
							'Cancel';


						cancelButton.hidden =
							true;


						addButton.parentElement
							.insertBefore(
								cancelButton,
								addButton
							);


						cancelButton.addEventListener(
							'click',
							() => {

								resetEditor();


								cancelButton.hidden =
									true;

							}
						);


						modularViewContent
							.querySelectorAll(
								'.modular-item-table-row'
							)
							.forEach(
								row => {

									row.addEventListener(
										'click',
										() => {

											cancelButton.hidden =
												false;

										}
									);

								}
							);

					}

				};


			try {

				await renderView();

			} catch (error) {

				console.error(
					'Failed to open modular view:',
					error
				);


				modularViewContent.innerHTML = `

					<div class="modular-view-error">

						<strong>
							Failed to load bay.
						</strong>

						<p>
							${escapeHtml(
								error.message ||
								'Something went wrong.'
							)}
						</p>

					</div>

				`;

			}

		}
	);

}


	/* =========================================================
	   CLOSE MODULAR VIEW
	========================================================= */

	modularViewClose.addEventListener(
		'click',
		() => {

			modularView.hidden =
				true;

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
				behavior:
					'smooth',

				block:
					'start'
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

				}
				else {

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