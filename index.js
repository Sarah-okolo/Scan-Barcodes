// IMPORT BARCODE DETECTOR POLYFILL
import { BarcodeDetector as BarcodeDetectorPolyfill } from "https://fastly.jsdelivr.net/npm/barcode-detector@2/dist/es/pure.min.js";
  
// CHECK IF THE BARCODE DETECTION FEATURE IS SUPPORTED IN THE BROWSER
if (!("BarcodeDetector" in window)) {
  // Use polyfill when the browser doesn't natively support the BarcodeDetector API
  window.BarcodeDetector = BarcodeDetectorPolyfill; 
};

// GET HTML ELEMENTS
const scanBtn = document.getElementById("scan-btn");
const formatListContainer = document.getElementById("format-list-container");
const camStream = document.querySelector("#camera-stream");
const resultContainer = document.getElementById("result-container");
const detectedFormat = document.getElementById("detected-format");
const result = document.getElementById("result");
const copyOpenBtn = document.getElementById("copy-open");
const errMsg = document.getElementById("err-msg");

let stream;
let formatList = [];

// CHECKS AND DISPLAYS THE SUPPORTED BARCODE TYPES
BarcodeDetector.getSupportedFormats().then((supportedFormats) => {
  supportedFormats.forEach((format, i) => {
    formatList.push(format);
    const div = document.createElement("div");
    div.className = "format";
    div.innerHTML = format;
    setTimeout(() => { formatListContainer.appendChild(div) }, i * 150)
  })
});

// DISPLAYS ERROR MESSAGES
const displayErrMsg = (message) => {
  errMsg.innerHTML = `<b>Error</b>: ${message}.<br><br>Try again`;
  errMsg.style.display = "block";
  camStream.style.display = "none";
  scanBtn.textContent = "Scan Barcode";
};

// DISPLAYS THE RESULT READ FROM THE BARCODE
const displayResult = (rslt, frmt) => {
  resultContainer.style.display = "grid";
  result.innerHTML = rslt;
  detectedFormat.innerHTML = frmt;
  // checks if the result is a link or a text
  if (result.innerHTML.includes("://")) {
    copyOpenBtn.innerHTML = "Open";
  } else {
    copyOpenBtn.innerHTML = "Copy";
  }
};

// STOPS THE CURRENT RUNNING CAMERA STREAM
const stopStream = (streamToStop) => {
  streamToStop.getTracks().forEach((track) => track.stop());
  camStream.style.display = "none";
  camStream.srcObject = null;
  scanBtn.textContent = "Scan Barcode";
};

// STARTS THE CAMERA STREAM AND SCANS ANY VISIBLE BARCODE IN SIGHT
async function scanBarcode() {
  try {
    camStream.style.display = "block";

    // Gets camera stream
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" }
      },
      audio: false
    });
    camStream.srcObject = stream;
    await camStream.play();
    scanBtn.textContent = "Scanning...";
    
    // Creates new barcode detection instance
    const barcodeDetector = new BarcodeDetector({ formats: formatList});
    let detected = false;
    
    // Runs detect() every second till a barcode is captured
    const intervalID = setInterval(async () => {
      // Detects the contents of the camera stream to capture any visible barcode
      const barcodes = await barcodeDetector.detect(camStream);
      const lastBarcode = barcodes[barcodes.length -1];
      // If barcode detected, stop stream and display result
      // If this runs, setTimeout callback doesn't run
      if (barcodes.length > 0) {
        stopStream(stream);
        // display only the last detected barcode
        displayResult(lastBarcode.rawValue, lastBarcode.format);
        detected = true;
        clearInterval(intervalID);
      }
    }, 1000);
    
    // Stop stream if nothing has been detected after 15 seconds
    setTimeout(() => {
      if (!detected) {
        stopStream(stream);
        displayErrMsg("Barcode Not Detected or Format Not Supported");
        clearInterval(intervalID);
      }}, 15000);
    
  } catch (e) {
    displayErrMsg(e.message);
  }
}

// RUNS THE BARCODE SCAN
scanBtn.onclick = () => {
  resultContainer.style.display = "none";
  errMsg.style.display = "none";
  scanBarcode();
};

// COPIES OR OPENS THE RESULT CONTENTS READ FROM THE BARCODE.
copyOpenBtn.onclick = (e) => {
  if (e.target.innerHTML == "Copy") {
    navigator.clipboard.writeText(result.innerHTML).then(() => {
      copyOpenBtn.innerHTML = "Copied!";
    });
  } else if (e.target.innerHTML == "Open") {
    window.open(result.innerHTML, "_blank");
  }
};