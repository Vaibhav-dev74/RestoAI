import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiBaseUrl';

export default function FaceAttendanceScanner({ restaurantId, staff = [], onSuccess, onClose }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [mode, setMode] = useState('clock-in');
  const [managerPin, setManagerPin] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    const loadModelsAndCamera = async () => {
      try {
        setIsLoading(true);
        setError('');

        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });

        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        setIsLoading(false);
      } catch (err) {
        setError('Failed to load models or camera. Please allow camera access and reload.');
        setIsLoading(false);
      }
    };

    loadModelsAndCamera();

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const stopScanning = () => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const startScanning = () => {
    setError('');
    setSuccess('');
    setIsScanning(true);

    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    scanIntervalRef.current = setInterval(() => {
      scanFrame();
    }, 1500);
  };

  const scanFrame = async () => {
    let timeoutId;

    try {
      if (!videoRef.current) return;

      const detectionPromise = faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Face detection timed out.')), 8000);
      });

      const detections = await Promise.race([detectionPromise, timeoutPromise]);
      clearTimeout(timeoutId);

      if (!detections || detections.length === 0) {
        setError('No face detected. Please position your face in the frame.');
        return;
      }

      if (detections.length > 1) {
        setError('Multiple faces detected. Please ensure only your face is visible.');
        return;
      }

      const detectionScore = detections[0]?.detection?.score ?? 0;
      if (detectionScore < 0.2) {
        setError('Face image quality is too low. Please try again in better lighting.');
        return;
      }

      const VITE_API_URL = API_BASE_URL;
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (!restaurantId) {
        setError('Restaurant not loaded yet. Please wait and try again.');
        return;
      }

      const pin = managerPin.trim();
      if (pin && !selectedUserId) {
        setError('Select a staff member for Manager PIN fallback.');
        return;
      }

      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) {
        setError('Camera not ready.');
        return;
      }

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const image = canvas.toDataURL('image/jpeg');

      const endpoint = mode === 'clock-out' ? 'clock-out' : 'clock-in';
      const payload = pin ? { userId: selectedUserId, managerPin: pin } : { image };

      const res = await axios.post(`${VITE_API_URL}/api/attendance/${endpoint}/${restaurantId}`, payload, {
        headers,
      });

      const u = res.data?.user;
      setError('');
      setSuccess(
        `${mode === 'clock-out' ? 'Clock out' : 'Clock in'} successful` + (u?.name ? ` for ${u.name}` : '')
      );
      if (onSuccess) onSuccess(res.data);
      stopScanning();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err?.response) {
        if (err.response.status === 400) setError(err.response.data?.error || 'Attendance failed.');
        else if (err.response.status === 401 || err.response.status === 403) setError('Unauthorized. Please login.');
        else if (err.response.status === 404) setError('User not found.');
        else setError(err.response.data?.error || 'Attendance failed.');
      } else {
        setError(err?.message || 'Network/server error. Please try again.');
      }
    }
  };

  return (
    <div style={{ padding: 24, background: 'white', borderRadius: 12, maxWidth: 420, margin: '0 auto' }}>
      <h2>Scan Attendance</h2>

      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: 8 }}>{success}</div>}

      {isLoading ? (
        <div>Loading models and camera...</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => setMode('clock-in')}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #ddd',
                background: mode === 'clock-in' ? '#6366f1' : 'white',
                color: mode === 'clock-in' ? 'white' : '#111',
                cursor: 'pointer',
              }}
            >
              Clock In
            </button>
            <button
              onClick={() => setMode('clock-out')}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #ddd',
                background: mode === 'clock-out' ? '#6366f1' : 'white',
                color: mode === 'clock-out' ? 'white' : '#111',
                cursor: 'pointer',
              }}
            >
              Clock Out
            </button>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>Optional fallback: Manager PIN</div>
            <input
              value={managerPin}
              onChange={(e) => setManagerPin(e.target.value)}
              placeholder="Enter manager PIN (optional)"
              type="password"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #ddd',
                fontSize: 14,
              }}
            />
          </div>

          {managerPin.trim() ? (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>Select staff (required for PIN)</div>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  fontSize: 14,
                  background: 'white',
                }}
              >
                <option value="">Select a staff member</option>
                {(Array.isArray(staff) ? staff : []).map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name || u.email || u._id}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <video
            ref={videoRef}
            autoPlay
            muted
            width={320}
            height={240}
            style={{ borderRadius: 8, border: '2px solid #eee' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <div style={{ marginTop: 16 }}>
            {!isScanning ? (
              <button onClick={startScanning} style={{ padding: '10px 20px', fontSize: 16 }}>
                Start Scanning
              </button>
            ) : (
              <button onClick={stopScanning} style={{ padding: '10px 20px', fontSize: 16 }}>
                Stop Scanning
              </button>
            )}
            <button
              onClick={() => {
                stopScanning();
                onClose?.();
              }}
              style={{ marginLeft: 12, padding: '10px 20px', fontSize: 16 }}
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}
