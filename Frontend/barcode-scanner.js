/* =========================================================
   SHARED BARCODE SCANNER
========================================================= */

let barcodeCameraStream = null;
let barcodeCameraVideo = null;
let barcodeCameraOverlay = null;
let barcodeReader = null;
let barcodeControls = null;
let barcodeScanLocked = false;


/* =========================================================
   CREATE CAMERA UI
========================================================= */

const createBarcodeScannerUI = () => {

	if (barcodeCameraOverlay) {
		return;
	}


	barcodeCameraOverlay =
		document.createElement('div');

	barcodeCameraOverlay.className =
		'barcode-camera-overlay';

	barcodeCameraOverlay.innerHTML = `
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
					<i data-lucide="x"></i>
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
		barcodeCameraOverlay
	);


	barcodeCameraVideo =
		barcodeCameraOverlay.querySelector(
			'.barcode-camera-video'
		);


	const closeButton =
		barcodeCameraOverlay.querySelector(
			'.barcode-camera-close'
		);


	closeButton.addEventListener(
		'click',
		stopBarcodeScanner
	);


	lucide.createIcons();

};


/* =========================================================
   START BARCODE SCANNER
========================================================= */

const startBarcodeScanner =
	async (
		onBarcodeDetected
	) => {

		createBarcodeScannerUI();


		barcodeScanLocked =
			false;


		try {

			barcodeCameraOverlay.classList.add(
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
					barcodeCameraVideo,
					async (
						result,
						error
					) => {

						if (
							barcodeScanLocked
						) {
							return;
						}


						if (result) {

							const barcode =
								result.getText();


							if (barcode) {

								barcodeScanLocked =
									true;


								await onBarcodeDetected(
									barcode
								);

							}

						}

					}
				);


		} catch (error) {

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

			} catch (error) {

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

			} catch (error) {

				console.error(
					'Unable to reset barcode reader:',
					error
				);

			}


			barcodeReader =
				null;

		}


		if (
			barcodeCameraStream
		) {

			barcodeCameraStream
				.getTracks()
				.forEach(
					track => {
						track.stop();
					}
				);


			barcodeCameraStream =
				null;

		}


		if (
			barcodeCameraVideo
		) {

			barcodeCameraVideo.pause();

			barcodeCameraVideo.srcObject =
				null;

		}


		if (
			barcodeCameraOverlay
		) {

			barcodeCameraOverlay.classList.remove(
				'active'
			);

		}

	};