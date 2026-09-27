import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiBaseUrl';

export default function FaceRegistration({ employeeId, onSuccess, onClose }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [faceImage, setFaceImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Keep video/canvas size in state for responsive layout
  const [videoSize, setVideoSize] = useState({ width: 320, height: 240 });

  // 1. Camera not accessible, 2. Model not loaded
  useEffect(() => {
    const loadModelsAndCamera = async () => {
      try {
        setIsLoading(true);
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
        } catch (camErr) {
          setError('Camera not accessible. Please allow camera access and try again.');
          setIsLoading(false);
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setVideoSize({ width: videoRef.current.videoWidth || 320, height: videoRef.current.videoHeight || 240 });
          };
        }
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load face recognition models.');
        setIsLoading(false);
      }
    };
    loadModelsAndCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Draw face guide overlay
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    function drawGuide() {
      // Always match canvas size to video size
      canvas.width = videoSize.width;
      canvas.height = videoSize.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw a semi-transparent circle in the center
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = Math.min(canvas.width, canvas.height) / 2.5;
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
      animId = requestAnimationFrame(drawGuide);
    }
    if (!faceImage && !isLoading) drawGuide();
    return () => cancelAnimationFrame(animId);
  }, [isLoading, faceImage, videoSize]);

  const handleRegister = async () => {
    setError('');
    setSuccess('');
    setIsRegistering(true);
    let timeoutId;
    try {
      // 11. Timeout during face detection
      const detectionPromise = faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();
      const timeoutPromise = new Promise((_, reject) => timeoutId = setTimeout(() => reject(new Error('Face detection timed out.')), 8000));
      const detections = await Promise.race([detectionPromise, timeoutPromise]);
      clearTimeout(timeoutId);
      // 2. No face detected
      if (!detections || detections.length === 0) {
        setError('No face detected. Please position your face in the circle and try again.');
        setIsRegistering(false);
        return;
      }
      // 3. Multiple faces detected
      if (detections.length > 1) {
        setError('Multiple faces detected. Please ensure only your face is visible.');
        setIsRegistering(false);
        return;
      }
      const detection = detections[0];
      // 12. Invalid image format (simulate by checking detection score)
      if (detection.detection && detection.detection.score < 0.2) {
        setError('Face image quality is too low. Please try again in better lighting.');
        setIsRegistering(false);
        return;
      }

      // Capture a snapshot to send to backend (backend computes embedding)
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) {
        setError('Camera not ready.');
        setIsRegistering(false);
        return;
      }
      canvas.width = video.videoWidth || videoSize.width || 320;
      canvas.height = video.videoHeight || videoSize.height || 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const capturedImage = canvas.toDataURL('image/jpeg');
      setFaceImage(capturedImage);

      const VITE_API_URL = API_BASE_URL;
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Register face embedding in backend
      try {
        await axios.post(
          `${VITE_API_URL}/api/attendance/faces/${employeeId}`,
          { image: capturedImage },
          { headers }
        );
        setSuccess('Face registered successfully!');
        if (onSuccess) onSuccess();
      } catch (err) {
        if (err.response) {
          if (err.response.status === 409) setError('Face already registered for this user.');
          else if (err.response.status === 404) setError('User not found.');
          else if (err.response.status === 401 || err.response.status === 403) setError('Unauthorized. Please login as the correct user.');
          else setError('Registration failed: ' + (err.response.data?.error || 'Unknown error.'));
        } else {
          setError('Network/server error. Please try again.');
        }
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      clearTimeout(timeoutId);
      setIsRegistering(false);
    }
  };

  const handleClose = () => {
    setFaceImage(null);
    setError('');
    setSuccess('');
    onClose && onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(30,32,48,0.82)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '32px 28px 24px 28px',
        minWidth: 320,
        maxWidth: 400,
        width: '100%',
        boxShadow: '0 8px 40px #23294633, 0 2px 12px #6366f122',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        fontFamily: 'Sora, DM Sans, sans-serif',
        alignItems: 'center',
        position: 'relative'
      }}>
        <button onClick={handleClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 28, color: '#64748b', cursor: 'pointer' }}>×</button>
        <h2 style={{ color: '#232946', fontWeight: 700, fontSize: '1.18rem', margin: 0 }}>📸 Register Your Face</h2>
        <div style={{ color: '#6366f1', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
          Position your face in the circle and click <b>Register Face</b> to scan.
        </div>
        {error && <div style={{ color: '#dc2626', fontWeight: 600 }}>{error}</div>}
        {success && <div style={{ color: '#22c55e', fontWeight: 600 }}>{success}</div>}
        {isLoading ? (
          <div>Loading models and camera...</div>
        ) : faceImage ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <img src={faceImage} alt="Detected face" style={{ borderRadius: 12, border: '2px solid #eee', width: 240, height: 180, objectFit: 'cover' }} />
              <div style={{ color: '#6366f1', fontWeight: 500, marginTop: 8 }}>Current Face</div>
            </div>
            <button onClick={() => setFaceImage(null)} style={{ padding: '10px 20px', fontSize: 16, background: '#e0e7ff', color: '#232946', border: 'none', borderRadius: 8, fontWeight: 600, marginTop: 8 }}>Scan Again</button>
            <button onClick={handleClose} style={{ marginLeft: 12, padding: '10px 20px', fontSize: 16 }}>Close</button>
          </>
        ) : (
          <div style={{ position: 'relative', width: videoSize.width, height: videoSize.height, maxWidth: '100%', margin: '0 auto' }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              width={videoSize.width}
              height={videoSize.height}
              style={{
                borderRadius: 12,
                border: '2px solid #eee',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                background: '#000',
              }}
            />
            <canvas
              ref={canvasRef}
              width={videoSize.width}
              height={videoSize.height}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            />
            <div style={{ marginTop: videoSize.height + 16, textAlign: 'center' }}>
              <button onClick={handleRegister} disabled={isRegistering} style={{ padding: '10px 20px', fontSize: 16, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600 }}>
                {isRegistering ? 'Registering...' : 'Register Face'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 