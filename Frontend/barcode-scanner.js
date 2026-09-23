/* =========================================================
   SHARED BARCODE SCANNER
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

const createCameraScanner = () => {

	if (cameraOverlay) {
		return;
	}

	cameraOverlay =
		document.createElement('div');

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

	lucide.createIcons();
};


/* =========================================================
   START BARCODE SCANNER
========================================================= */

const startBarcodeScanner =
	async (
		onBarcodeDetected
	) => {

		createCameraScanner();

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

	};