#!/usr/bin/env python3
"""
Facial Recognition Service using DeepFace
This script provides face registration and recognition functionality
"""

import os
import sys

# Configure UTF-8 encoding for Windows stdout/stderr
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import json
import base64
import numpy as np
try:
    from deepface import DeepFace
except Exception as e:
    DeepFace = None
    _deepface_import_error = str(e)
else:
    _deepface_import_error = None

from PIL import Image
import io
import cv2
import tempfile
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FaceRecognitionService:
    def __init__(self, faces_dir="faces"):
        self.faces_dir = faces_dir
        self.ensure_faces_directory()
        
    def ensure_faces_directory(self):
        """Ensure the faces directory exists"""
        if not os.path.exists(self.faces_dir):
            os.makedirs(self.faces_dir)
            logger.info(f"Created faces directory: {self.faces_dir}")
    
    def base64_to_image(self, base64_string):
        """Convert base64 string to PIL Image"""
        try:
            # Remove data URL prefix if present
            if base64_string.startswith('data:image'):
                base64_string = base64_string.split(',')[1]
            
            image_data = base64.b64decode(base64_string)
            image = Image.open(io.BytesIO(image_data))
            return image
        except Exception as e:
            logger.error(f"Error converting base64 to image: {e}")
            return None
    
    def save_face_image(self, user_id, image):
        """Save face image to disk"""
        try:
            filename = f"{user_id}.jpg"
            filepath = os.path.join(self.faces_dir, filename)
            image.save(filepath, "JPEG")
            logger.info(f"Saved face image: {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Error saving face image: {e}")
            return None
    
    def register_face(self, user_id, base64_image):
        """Register a new face for a user"""
        try:
            # Convert base64 to image
            image = self.base64_to_image(base64_image)
            if image is None:
                return {"success": False, "error": "Invalid image data"}
            
            # Save the image
            filepath = self.save_face_image(user_id, image)
            if filepath is None:
                return {"success": False, "error": "Failed to save image"}
            
            # Verify the face can be processed by DeepFace
            if DeepFace is None:
                return {"success": False, "error": f"DeepFace library not available: {_deepface_import_error}"}
            try:
                # Convert PIL image to numpy array for DeepFace
                img_array = np.array(image)
                if len(img_array.shape) == 3:
                    img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
                
                # Test face detection
                faces = DeepFace.extract_faces(img_path=img_array, enforce_detection=False)
                if not faces:
                    return {"success": False, "error": "No face detected in image"}
                
                logger.info(f"Successfully registered face for user: {user_id}")
                return {"success": True, "message": "Face registered successfully"}
                
            except Exception as e:
                logger.error(f"DeepFace processing error: {e}")
                return {"success": False, "error": f"Face processing failed: {str(e)}"}
                
        except Exception as e:
            logger.error(f"Registration error: {e}")
            return {"success": False, "error": str(e)}
    
    def recognize_face(self, base64_image, threshold=0.6):
        """Recognize a face and return the best match"""
        if DeepFace is None:
            return {"success": False, "error": f"DeepFace library not available: {_deepface_import_error}"}
        try:
            # Convert base64 to image
            image = self.base64_to_image(base64_image)
            if image is None:
                return {"success": False, "error": "Invalid image data"}
            
            # Convert PIL image to numpy array
            img_array = np.array(image)
            if len(img_array.shape) == 3:
                img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            # Get all registered face files
            face_files = [f for f in os.listdir(self.faces_dir) if f.endswith('.jpg')]
            if not face_files:
                return {"success": False, "error": "No registered faces found"}
            
            best_match = None
            best_distance = float('inf')
            
            # Compare with each registered face
            for face_file in face_files:
                try:
                    user_id = face_file.replace('.jpg', '')
                    registered_face_path = os.path.join(self.faces_dir, face_file)
                    
                    # Use DeepFace to verify
                    result = DeepFace.verify(
                        img1_path=img_array,
                        img2_path=registered_face_path,
                        enforce_detection=False,
                        model_name="VGG-Face",
                        distance_metric="cosine"
                    )
                    
                    distance = result['distance']
                    if distance < best_distance and distance < threshold:
                        best_distance = distance
                        best_match = {
                            "user_id": user_id,
                            "distance": distance,
                            "verified": result['verified']
                        }
                        
                except Exception as e:
                    logger.warning(f"Error comparing with {face_file}: {e}")
                    continue
            
            if best_match:
                logger.info(f"Face recognized: {best_match['user_id']} (distance: {best_match['distance']:.4f})")
                return {
                    "success": True,
                    "user_id": best_match['user_id'],
                    "confidence": 1 - best_match['distance'],
                    "distance": best_match['distance']
                }
            else:
                return {"success": False, "error": "No matching face found"}
                
        except Exception as e:
            logger.error(f"Recognition error: {e}")
            return {"success": False, "error": str(e)}
    
    def delete_face(self, user_id):
        """Delete a registered face"""
        try:
            filename = f"{user_id}.jpg"
            filepath = os.path.join(self.faces_dir, filename)
            
            if os.path.exists(filepath):
                os.remove(filepath)
                logger.info(f"Deleted face image: {filepath}")
                return {"success": True, "message": "Face deleted successfully"}
            else:
                return {"success": False, "error": "Face not found"}
                
        except Exception as e:
            logger.error(f"Delete error: {e}")
            return {"success": False, "error": str(e)}
    
    def list_registered_faces(self):
        """List all registered faces"""
        try:
            face_files = [f.replace('.jpg', '') for f in os.listdir(self.faces_dir) if f.endswith('.jpg')]
            return {"success": True, "faces": face_files}
        except Exception as e:
            logger.error(f"List error: {e}")
            return {"success": False, "error": str(e)}

def main():
    """Main function to handle command line arguments"""
    import argparse
    parser = argparse.ArgumentParser(description="Face Recognition Service")
    parser.add_argument('command', choices=['register', 'recognize', 'delete', 'list', 'embed'])
    parser.add_argument('arg1', nargs='?')
    parser.add_argument('arg2', nargs='?')
    parser.add_argument('--stdin', action='store_true', help='Read input from stdin as JSON')
    args = parser.parse_args()

    service = FaceRecognitionService()

    try:
        if args.stdin:
            # Read JSON from stdin
            input_data = json.load(sys.stdin)
            if args.command == 'register':
                user_id = input_data.get('userId')
                base64_image = input_data.get('image')
                result = service.register_face(user_id, base64_image)
                print(json.dumps(result))
            elif args.command == 'recognize':
                base64_image = input_data.get('image')
                result = service.recognize_face(base64_image)
                print(json.dumps(result))
            elif args.command == 'embed':
                if DeepFace is None:
                    print(json.dumps({"success": False, "error": f"DeepFace library not available: {_deepface_import_error}"}))
                    sys.exit(0)
                base64_image = input_data.get('image')
                image = service.base64_to_image(base64_image)
                if image is None:
                    print(json.dumps({"success": False, "error": "Invalid image data"}))
                    sys.exit(0)
                try:
                    img_array = np.array(image)
                    if len(img_array.shape) == 3:
                        img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

                    reps = DeepFace.represent(
                        img_path=img_array,
                        model_name="VGG-Face",
                        enforce_detection=False,
                    )
                    if not reps:
                        print(json.dumps({"success": False, "error": "No face embedding produced"}))
                        sys.exit(0)
                    embedding = reps[0].get('embedding')
                    if embedding is None:
                        print(json.dumps({"success": False, "error": "No embedding in result"}))
                        sys.exit(0)
                    print(json.dumps({"success": True, "model": "VGG-Face", "embedding": embedding}))
                except Exception as e:
                    print(json.dumps({"success": False, "error": f"Embedding failed: {str(e)}"}))
            else:
                print(json.dumps({"error": f"Command '{args.command}' does not support --stdin"}))
                sys.exit(1)
        else:
            if args.command == "register":
                if not args.arg1 or not args.arg2:
                    print(json.dumps({"error": "Usage: python face_recognition_service.py register <user_id> <base64_image>"}))
                    sys.exit(1)
                user_id = args.arg1
                base64_image = args.arg2
                result = service.register_face(user_id, base64_image)
                print(json.dumps(result))
            elif args.command == "recognize":
                if not args.arg1:
                    print(json.dumps({"error": "Usage: python face_recognition_service.py recognize <base64_image>"}))
                    sys.exit(1)
                base64_image = args.arg1
                result = service.recognize_face(base64_image)
                print(json.dumps(result))
            elif args.command == "delete":
                if not args.arg1:
                    print(json.dumps({"error": "Usage: python face_recognition_service.py delete <user_id>"}))
                    sys.exit(1)
                user_id = args.arg1
                result = service.delete_face(user_id)
                print(json.dumps(result))
            elif args.command == "list":
                result = service.list_registered_faces()
                print(json.dumps(result))
            elif args.command == "embed":
                if DeepFace is None:
                    print(json.dumps({"success": False, "error": f"DeepFace library not available: {_deepface_import_error}"}))
                    sys.exit(0)
                if not args.arg1:
                    print(json.dumps({"error": "Usage: python face_recognition_service.py embed <base64_image>"}))
                    sys.exit(1)
                base64_image = args.arg1
                image = service.base64_to_image(base64_image)
                if image is None:
                    print(json.dumps({"success": False, "error": "Invalid image data"}))
                    sys.exit(0)
                try:
                    img_array = np.array(image)
                    if len(img_array.shape) == 3:
                        img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
                    reps = DeepFace.represent(
                        img_path=img_array,
                        model_name="VGG-Face",
                        enforce_detection=False,
                    )
                    if not reps:
                        print(json.dumps({"success": False, "error": "No face embedding produced"}))
                        sys.exit(0)
                    embedding = reps[0].get('embedding')
                    if embedding is None:
                        print(json.dumps({"success": False, "error": "No embedding in result"}))
                        sys.exit(0)
                    print(json.dumps({"success": True, "model": "VGG-Face", "embedding": embedding}))
                except Exception as e:
                    print(json.dumps({"success": False, "error": f"Embedding failed: {str(e)}"}))
            else:
                print(json.dumps({"error": f"Unknown command: {args.command}"}))
                sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main() 