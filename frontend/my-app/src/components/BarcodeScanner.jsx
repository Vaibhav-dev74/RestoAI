import React, { useRef, useEffect, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import Quagga from 'quagga';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';

export default function BarcodeScanner({ onDetected, onCancel }) {
  const videoRef = useRef();
  const canvasRef = useRef();
  const overlayRef = useRef();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(true);
  const [barcodeValue, setBarcodeValue] = useState('');
  const [productInfo, setProductInfo] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  const [noBarcode, setNoBarcode] = useState(false);
  const [detectionStart, setDetectionStart] = useState(null);
  const frameCount = useRef(0);
  const [objectDetections, setObjectDetections] = useState([]);
  const [cocoModel, setCocoModel] = useState(null);

  useEffect(() => {
    let stream;
    let animationId;
    let codeReader = new BrowserMultiFormatReader();
    let isMounted = true;

    const handleLoadedMetadata = () => {
      setVideoReady(true);
    };

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current && videoRef.current.srcObject !== stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
          try {
            await videoRef.current.play();
          } catch (err) {
            if (err.name !== 'AbortError') {
              setError('Camera error: ' + err.message);
            }
            // Ignore AbortError
          }
        }
      } catch (err) {
        setError('Camera access denied or not available.');
        setLoading(false);
      }
    };

    const processFrame = async () => {
      if (!isMounted || !window.cv || !videoRef.current || !canvasRef.current || !overlayRef.current) return;
      frameCount.current++;
      if (frameCount.current % 2 !== 0) {
        animationId = requestAnimationFrame(processFrame);
        return;
      }
      const video = videoRef.current;
      if (!videoReady || video.videoWidth === 0 || video.videoHeight === 0) {
        animationId = requestAnimationFrame(processFrame);
        return;
      }
      const canvas = canvasRef.current;
      const overlay = overlayRef.current;
      const ctx = canvas.getContext('2d');
      const overlayCtx = overlay.getContext('2d');
      canvas.width = overlay.width = video.videoWidth;
      canvas.height = overlay.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

      // --- TensorFlow.js COCO-SSD object detection ---
      if (cocoModel) {
        const tfImg = tf.browser.fromPixels(canvas);
        const predictions = await cocoModel.detect(tfImg);
        tfImg.dispose();
        setObjectDetections(predictions);
        if (predictions.length > 0) {
          predictions.forEach(pred => {
            overlayCtx.beginPath();
            overlayCtx.rect(...pred.bbox);
            overlayCtx.strokeStyle = '#22c55e';
            overlayCtx.lineWidth = 4;
            overlayCtx.stroke();
            overlayCtx.font = 'bold 18px monospace';
            overlayCtx.fillStyle = '#22c55e';
            overlayCtx.fillText(`${pred.class} (${(pred.score*100).toFixed(1)}%)`, pred.bbox[0], pred.bbox[1] > 20 ? pred.bbox[1] - 8 : pred.bbox[1] + 20);
          });
        }
      }

      // --- Barcode detection with minAreaRect for tilted barcodes ---
      let src = window.cv.imread(canvas);
      let gray = new window.cv.Mat();
      let grad = new window.cv.Mat();
      let blurred = new window.cv.Mat();
      let thresh = new window.cv.Mat();
      let kernel = window.cv.getStructuringElement(window.cv.MORPH_RECT, new window.cv.Size(21, 7));
      window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY, 0);
      window.cv.Sobel(gray, grad, window.cv.CV_8U, 1, 0, 3, 1, 0, window.cv.BORDER_DEFAULT);
      window.cv.morphologyEx(grad, grad, window.cv.MORPH_CLOSE, kernel);
      window.cv.blur(grad, blurred, new window.cv.Size(9, 9));
      window.cv.adaptiveThreshold(blurred, thresh, 255, window.cv.ADAPTIVE_THRESH_MEAN_C, window.cv.THRESH_BINARY, 15, -2);
      kernel = window.cv.getStructuringElement(window.cv.MORPH_RECT, new window.cv.Size(21, 7));
      window.cv.morphologyEx(thresh, thresh, window.cv.MORPH_CLOSE, kernel);
      let contours = new window.cv.MatVector();
      let hierarchy = new window.cv.Mat();
      window.cv.findContours(thresh, contours, hierarchy, window.cv.RETR_EXTERNAL, window.cv.CHAIN_APPROX_SIMPLE);
      console.log('Contours found:', contours.size());

      // Fallback: Try decoding the whole frame first
      let foundBarcode = false;
      try {
        const decoded = await tryDecodeAllVariants(ctx, canvas.width, canvas.height, codeReader);
        if (decoded) {
          overlayCtx.strokeStyle = '#22c55e';
          overlayCtx.lineWidth = 5;
          overlayCtx.strokeRect(0, 0, canvas.width, canvas.height);
          overlayCtx.font = 'bold 22px monospace';
          overlayCtx.fillStyle = '#22c55e';
          overlayCtx.fillText(decoded, 20, 40);
          setBarcodeValue(decoded);
          setScanning(false);
          onDetected(decoded);
          foundBarcode = true;
        }
      } catch (e) {}

      // Draw all contours in yellow for debugging
      let maxArea = 0;
      let maxContourIdx = -1;
      for (let i = 0; i < contours.size(); i++) {
        let cnt = contours.get(i);
        let area = window.cv.contourArea(cnt);
        if (area > maxArea) {
          maxArea = area;
          maxContourIdx = i;
        }
        if (area > 50) {
          let rotatedRect = window.cv.minAreaRect(cnt);
          let vertices = window.cv.RotatedRect.points(rotatedRect);
          overlayCtx.beginPath();
          overlayCtx.moveTo(vertices[0].x, vertices[0].y);
          for (let j = 1; j < 4; j++) {
            overlayCtx.lineTo(vertices[j].x, vertices[j].y);
          }
          overlayCtx.closePath();
          overlayCtx.strokeStyle = '#facc15'; // yellow
          overlayCtx.lineWidth = 2;
          overlayCtx.stroke();
        }
        cnt.delete();
      }
      // Try all significant contours for barcode (with margin)
      for (let i = 0; i < contours.size(); i++) {
        let cnt = contours.get(i);
        let area = window.cv.contourArea(cnt);
        console.log('Contour', i, 'area:', area);
        if (area > 400) {
          let rotatedRect = window.cv.minAreaRect(cnt);
          let vertices = window.cv.RotatedRect.points(rotatedRect);
          let minX = Math.min(...vertices.map(v => v.x));
          let minY = Math.min(...vertices.map(v => v.y));
          let maxX = Math.max(...vertices.map(v => v.x));
          let maxY = Math.max(...vertices.map(v => v.y));
          // Expand crop by 20% margin
          let marginX = Math.floor((maxX - minX) * 0.2);
          let marginY = Math.floor((maxY - minY) * 0.2);
          minX = Math.max(0, minX - marginX);
          minY = Math.max(0, minY - marginY);
          maxX = Math.min(canvas.width, maxX + marginX);
          maxY = Math.min(canvas.height, maxY + marginY);
          let cropW = Math.max(1, Math.floor(maxX - minX));
          let cropH = Math.max(1, Math.floor(maxY - minY));
          let barcodeCanvas = document.createElement('canvas');
          barcodeCanvas.width = cropW;
          barcodeCanvas.height = cropH;
          let barcodeCtx = barcodeCanvas.getContext('2d');
          barcodeCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
          try {
            console.log('Trying to decode contour', i);
            const decoded = await tryDecodeAllVariants(barcodeCtx, cropW, cropH, codeReader);
            if (decoded) {
              // Draw green quadrilateral
              overlayCtx.beginPath();
              overlayCtx.moveTo(vertices[0].x, vertices[0].y);
              for (let j = 1; j < 4; j++) {
                overlayCtx.lineTo(vertices[j].x, vertices[j].y);
              }
              overlayCtx.closePath();
              overlayCtx.strokeStyle = '#22c55e';
              overlayCtx.lineWidth = 5;
              overlayCtx.stroke();
              overlayCtx.font = 'bold 22px monospace';
              overlayCtx.fillStyle = '#22c55e';
              overlayCtx.fillText(decoded, minX, minY - 10 < 20 ? minY + 30 : minY - 10);
              setBarcodeValue(decoded);
              setScanning(false);
              onDetected(decoded);
              foundBarcode = true;
              cnt.delete();
              break;
            }
          } catch (e) { console.log('Decode error for contour', i, e); }
        }
        cnt.delete();
      }
      // If nothing decoded, draw a green box around the largest contour for feedback
      if (!foundBarcode && maxContourIdx !== -1) {
        let cnt = contours.get(maxContourIdx);
        let rotatedRect = window.cv.minAreaRect(cnt);
        let vertices = window.cv.RotatedRect.points(rotatedRect);
        overlayCtx.beginPath();
        overlayCtx.moveTo(vertices[0].x, vertices[0].y);
        for (let j = 1; j < 4; j++) {
          overlayCtx.lineTo(vertices[j].x, vertices[j].y);
        }
        overlayCtx.closePath();
        overlayCtx.strokeStyle = '#22c55e';
        overlayCtx.lineWidth = 3;
        overlayCtx.stroke();
        cnt.delete();
      }
      // Clean up
      src.delete(); gray.delete(); grad.delete(); blurred.delete(); thresh.delete(); contours.delete(); hierarchy.delete();

      if (!foundBarcode && scanning) animationId = requestAnimationFrame(processFrame);
    };

    const waitForOpenCV = () => {
      if (window.cv && window.cv.imread) {
        setLoading(false);
        startCamera();
        animationId = requestAnimationFrame(processFrame);
      } else {
        setTimeout(waitForOpenCV, 100);
      }
    };
    waitForOpenCV();

    return () => {
      isMounted = false;
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (animationId) cancelAnimationFrame(animationId);
      if (videoRef.current) videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
    // eslint-disable-next-line
  }, [videoReady]);

  // Load COCO-SSD model on mount
  useEffect(() => {
    cocoSsd.load().then(model => setCocoModel(model));
  }, []);

  // Lookup product info when barcodeValue changes
  useEffect(() => {
    if (barcodeValue) {
      setProductInfo(null);
      fetch(`https://world.openfoodfacts.org/api/v0/product/${barcodeValue}.json`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 1) {
            setProductInfo({
              name: data.product.product_name || '',
              quantity: data.product.quantity || '',
              brands: data.product.brands || '',
            });
            // Pass object to parent
            if (onDetected) onDetected({
              barcode: barcodeValue,
              name: data.product.product_name || '',
              quantity: data.product.quantity || '',
              brands: data.product.brands || '',
            });
          } else {
            setProductInfo({ notFound: true });
            if (onDetected) onDetected({ barcode: barcodeValue });
          }
        })
        .catch(() => {
          setProductInfo({ notFound: true });
          if (onDetected) onDetected({ barcode: barcodeValue });
        });
    }
  }, [barcodeValue]);

  // Start detection timer when scanning starts
  useEffect(() => {
    if (scanning) {
      setDetectionStart(Date.now());
      setNoBarcode(false);
    }
  }, [scanning]);

  // If no barcode detected after 5 seconds, show message
  useEffect(() => {
    if (detectionStart && scanning) {
      const timeout = setTimeout(() => setNoBarcode(true), 5000);
      return () => clearTimeout(timeout);
    }
  }, [detectionStart, scanning]);

  return (
    <div className="flex flex-col items-center w-full" style={{ position: 'relative' }}>
      {loading ? (
        <div className="p-8 text-center">Loading scanner...</div>
      ) : error ? (
        <div className="p-4 text-red-600">{error}</div>
      ) : (
        <div style={{ position: 'relative', width: 320, height: 240 }}>
          <video ref={videoRef} className="rounded-lg mb-2" style={{ width: 320, height: 240 }} playsInline muted />
          <canvas ref={canvasRef} className="hidden" />
          <canvas ref={overlayRef} style={{ position: 'absolute', top: 0, left: 0, width: 320, height: 240, pointerEvents: 'none', zIndex: 100 }} />
          <div className="text-slate-600 text-sm mb-2" style={{position:'absolute',bottom:0,left:0,right:0,textAlign:'center',background:'rgba(255,255,255,0.7)'}}>
            {objectDetections && objectDetections.length > 0 ? (
              <>
                {objectDetections.map((obj, idx) => (
                  <div key={idx}>Detected: <b>{obj.class}</b> ({(obj.score*100).toFixed(1)}%)</div>
                ))}
              </>
            ) : barcodeValue ? (
              productInfo ? (
                productInfo.notFound ? (
                  <>Barcode: {barcodeValue} <br /> Product not found.</>
                ) : (
                  <>
                    Barcode: {barcodeValue} <br />
                    Product: <b>{productInfo.name}</b> <br />
                    Quantity: <b>{productInfo.quantity}</b> <br />
                    Brand: <b>{productInfo.brands}</b>
                  </>
                )
              ) : (
                <>Barcode: {barcodeValue} <br /> Looking up product...</>
              )
            ) : noBarcode ? (
              <span style={{ color: '#dc2626' }}>No barcode detected. Try adjusting lighting, focus, or barcode type.</span>
            ) : 'Show a barcode or object to scan!'}
          </div>
        </div>
      )}
      <button
        className="mt-4 px-4 py-2 bg-slate-200 text-slate-800 rounded"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}

// Helper: Try multiple preprocessing strategies for decoding
async function tryDecodeAllVariants(ctx, w, h, codeReader) {
  const variants = [];
  // 1. Raw image
  variants.push(ctx.getImageData(0, 0, w, h));
  // 2. Grayscale
  let cvsrc = window.cv.imread(ctx.canvas);
  let gray = new window.cv.Mat();
  window.cv.cvtColor(cvsrc, gray, window.cv.COLOR_RGBA2GRAY, 0);
  let grayCanvas = document.createElement('canvas');
  grayCanvas.width = w; grayCanvas.height = h;
  window.cv.imshow(grayCanvas, gray);
  variants.push(grayCanvas.getContext('2d').getImageData(0, 0, w, h));
  // 3. Inverted grayscale
  let inv = new window.cv.Mat();
  window.cv.bitwise_not(gray, inv);
  let invCanvas = document.createElement('canvas');
  invCanvas.width = w; invCanvas.height = h;
  window.cv.imshow(invCanvas, inv);
  variants.push(invCanvas.getContext('2d').getImageData(0, 0, w, h));
  // 4. Adaptive threshold
  let thresh = new window.cv.Mat();
  window.cv.adaptiveThreshold(gray, thresh, 255, window.cv.ADAPTIVE_THRESH_MEAN_C, window.cv.THRESH_BINARY, 15, -2);
  let threshCanvas = document.createElement('canvas');
  threshCanvas.width = w; threshCanvas.height = h;
  window.cv.imshow(threshCanvas, thresh);
  variants.push(threshCanvas.getContext('2d').getImageData(0, 0, w, h));
  // 5. Increased contrast
  let contrast = new window.cv.Mat();
  gray.convertTo(contrast, -1, 2, 0); // alpha=2, beta=0
  let contrastCanvas = document.createElement('canvas');
  contrastCanvas.width = w; contrastCanvas.height = h;
  window.cv.imshow(contrastCanvas, contrast);
  variants.push(contrastCanvas.getContext('2d').getImageData(0, 0, w, h));
  // 6. Histogram equalization
  let histEq = new window.cv.Mat();
  window.cv.equalizeHist(gray, histEq);
  let histEqCanvas = document.createElement('canvas');
  histEqCanvas.width = w; histEqCanvas.height = h;
  window.cv.imshow(histEqCanvas, histEq);
  variants.push(histEqCanvas.getContext('2d').getImageData(0, 0, w, h));
  // Try decoding each variant with zxing-js
  for (let i = 0; i < variants.length; i++) {
    try {
      const luminanceSource = codeReader.createLuminanceSource(variants[i]);
      const binaryBitmap = codeReader.createBinaryBitmap(luminanceSource);
      const result = codeReader.decodeBitmap(binaryBitmap);
      if (result && result.getText()) {
        console.log('Decoded with variant', i, ':', result.getText());
        // Clean up
        cvsrc.delete(); gray.delete(); inv.delete(); thresh.delete(); contrast.delete(); histEq.delete();
        return result.getText();
      }
    } catch (e) {}
  }
  // Try QuaggaJS as a fallback
  for (let i = 0; i < variants.length; i++) {
    const imageData = variants[i];
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').putImageData(imageData, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    let quaggaResult = await new Promise(resolve => {
      Quagga.decodeSingle({
        src: dataUrl,
        numOfWorkers: 0,
        inputStream: { size: w },
        decoder: { readers: ['ean_reader', 'ean_8_reader', 'code_128_reader', 'upc_reader', 'upc_e_reader'] }
      }, function(result) {
        if (result && result.codeResult && result.codeResult.code) {
          resolve(result.codeResult.code);
        } else {
          resolve(null);
        }
      });
    });
    if (quaggaResult) {
      console.log('Decoded with QuaggaJS variant', i, ':', quaggaResult);
      cvsrc.delete(); gray.delete(); inv.delete(); thresh.delete(); contrast.delete(); histEq.delete();
      return quaggaResult + ' (QuaggaJS)';
    }
  }
  // Clean up
  cvsrc.delete(); gray.delete(); inv.delete(); thresh.delete(); contrast.delete(); histEq.delete();
  return null;
} 