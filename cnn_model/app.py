"""
CNN Plant Disease Detection - Flask API Microservice
=====================================================
Serves the trained MobileNetV2 CNN model as a REST API.

Endpoint:
    POST /predict
        - Accepts: multipart/form-data with an 'image' field
        - Returns: JSON with predicted_class, confidence, plant_type, disease_name

Usage:
    python app.py
    # Server starts on http://localhost:5000
"""

import os
import json
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from PIL import Image

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from Node.js backend

# ── Configuration ──────────────────────────────────────────────────────────────
IMG_SIZE = 224
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, "saved_model", "plant_disease_model.h5")
LABELS_PATH = os.path.join(SCRIPT_DIR, "saved_model", "class_labels.json")

# ── Load model and labels at startup ───────────────────────────────────────────
model = None
class_labels = None


def load_resources():
    """Load the trained CNN model and class labels into memory."""
    global model, class_labels

    if not os.path.exists(MODEL_PATH):
        print(f"[ERROR] Model file not found at: {MODEL_PATH}")
        print("Please train the model first by running: python train_model.py")
        return False

    if not os.path.exists(LABELS_PATH):
        print(f"[ERROR] Class labels file not found at: {LABELS_PATH}")
        print("Please train the model first by running: python train_model.py")
        return False

    print("[INFO] Loading CNN model...")
    model = load_model(MODEL_PATH)
    print("[INFO] CNN model loaded successfully.")

    with open(LABELS_PATH, "r") as f:
        class_labels = json.load(f)
    print(f"[INFO] Loaded {len(class_labels)} class labels.")

    return True


def preprocess_image(image_file):
    """
    Preprocess an uploaded image for CNN prediction.

    Steps:
        1. Open image with PIL
        2. Convert to RGB (handle RGBA/grayscale)
        3. Resize to 224x224
        4. Convert to numpy array
        5. Normalize pixel values to [0, 1]
        6. Add batch dimension
    """
    image = Image.open(image_file)
    image = image.convert("RGB")
    image = image.resize((IMG_SIZE, IMG_SIZE))
    img_array = img_to_array(image)
    img_array = img_array / 255.0  # Normalize to [0, 1]
    img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension: (1, 224, 224, 3)
    return img_array


@app.route("/predict", methods=["POST"])
def predict():
    """
    CNN Disease Prediction Endpoint.

    Accepts an image file via multipart/form-data and returns
    the predicted plant disease with confidence score.
    """
    if model is None or class_labels is None:
        return jsonify({
            "error": "CNN model not loaded. Please train the model first."
        }), 503

    if "image" not in request.files:
        return jsonify({"error": "No image file provided. Send as 'image' field."}), 400

    image_file = request.files["image"]
    if image_file.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    try:
        # Preprocess the image
        img_array = preprocess_image(image_file)

        # Run CNN inference
        predictions = model.predict(img_array, verbose=0)
        predicted_index = int(np.argmax(predictions[0]))
        confidence = float(np.max(predictions[0])) * 100  # Convert to percentage

        # Map index to class label
        label_info = class_labels.get(str(predicted_index), {})
        folder_name = label_info.get("folder", "Unknown")
        plant_type = label_info.get("plant", "Unknown")
        disease_name = label_info.get("disease", "Unknown")

        # Get top-3 predictions for additional context
        top3_indices = np.argsort(predictions[0])[::-1][:3]
        top3_predictions = []
        for idx in top3_indices:
            info = class_labels.get(str(int(idx)), {})
            top3_predictions.append({
                "plant": info.get("plant", "Unknown"),
                "disease": info.get("disease", "Unknown"),
                "confidence": round(float(predictions[0][idx]) * 100, 2)
            })

        return jsonify({
            "success": True,
            "predicted_class": folder_name,
            "plant_type": plant_type,
            "disease_name": disease_name,
            "confidence": round(confidence, 2),
            "top3": top3_predictions
        })

    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint to verify the CNN service is running."""
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "num_classes": len(class_labels) if class_labels else 0
    })


if __name__ == "__main__":
    if load_resources():
        print("\n" + "=" * 50)
        print("  CNN Microservice running on http://localhost:5000")
        print("  Endpoints:")
        print("    POST /predict  - Upload image for disease detection")
        print("    GET  /health   - Health check")
        print("=" * 50 + "\n")
        app.run(host="0.0.0.0", port=5000, debug=False)
    else:
        print("\n[FATAL] Could not start server. Model files missing.")
        print("Run 'python train_model.py' first to train the CNN model.")
