"""
CNN Plant Disease Detection - Standalone Prediction Utility
============================================================
Test the trained CNN model on individual images from the command line.

Usage:
    python predict.py --image path/to/leaf_image.jpg
    python predict.py --image path/to/leaf_image.jpg --top 5
"""

import os
import sys
import json
import argparse
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from PIL import Image

# ── Configuration ──────────────────────────────────────────────────────────────
IMG_SIZE = 224
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, "saved_model", "plant_disease_model.h5")
LABELS_PATH = os.path.join(SCRIPT_DIR, "saved_model", "class_labels.json")


def preprocess_image(image_path):
    """Load and preprocess an image for CNN prediction."""
    image = Image.open(image_path)
    image = image.convert("RGB")
    image = image.resize((IMG_SIZE, IMG_SIZE))
    img_array = img_to_array(image)
    img_array = img_array / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array


def predict(image_path, top_n=3):
    """Run CNN inference on a single image and print results."""

    # Validate files exist
    if not os.path.exists(MODEL_PATH):
        print(f"[ERROR] Model not found at: {MODEL_PATH}")
        print("Train the model first: python train_model.py")
        sys.exit(1)

    if not os.path.exists(LABELS_PATH):
        print(f"[ERROR] Labels not found at: {LABELS_PATH}")
        sys.exit(1)

    if not os.path.exists(image_path):
        print(f"[ERROR] Image not found at: {image_path}")
        sys.exit(1)

    # Load model and labels
    print(f"Loading model from: {MODEL_PATH}")
    model = load_model(MODEL_PATH)

    with open(LABELS_PATH, "r") as f:
        class_labels = json.load(f)

    # Preprocess and predict
    print(f"Processing image: {image_path}")
    img_array = preprocess_image(image_path)
    predictions = model.predict(img_array, verbose=0)

    # Get top-N predictions
    top_indices = np.argsort(predictions[0])[::-1][:top_n]

    print("\n" + "=" * 55)
    print("  CNN Plant Disease Detection Results")
    print("=" * 55)
    print(f"  Image: {os.path.basename(image_path)}")
    print("-" * 55)

    for rank, idx in enumerate(top_indices, 1):
        info = class_labels.get(str(int(idx)), {})
        plant = info.get("plant", "Unknown")
        disease = info.get("disease", "Unknown")
        conf = float(predictions[0][idx]) * 100

        marker = " ◀ BEST MATCH" if rank == 1 else ""
        print(f"  #{rank}  {plant} - {disease}")
        print(f"       Confidence: {conf:.2f}%{marker}")
        if rank < len(top_indices):
            print()

    print("=" * 55)

    # Return top prediction
    top_info = class_labels.get(str(int(top_indices[0])), {})
    return {
        "plant": top_info.get("plant", "Unknown"),
        "disease": top_info.get("disease", "Unknown"),
        "confidence": float(np.max(predictions[0])) * 100,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Predict plant disease from a leaf image using the trained CNN model."
    )
    parser.add_argument(
        "--image", "-i",
        type=str,
        required=True,
        help="Path to the leaf image file (JPG, PNG, etc.)"
    )
    parser.add_argument(
        "--top", "-t",
        type=int,
        default=3,
        help="Number of top predictions to show (default: 3)"
    )
    args = parser.parse_args()

    predict(args.image, args.top)
