# 🌿 CNN Plant Disease Detection — Setup Guide

This module adds a real **Convolutional Neural Network (CNN)** using **MobileNetV2 + Transfer Learning** to detect plant diseases from leaf images.

---

## Architecture

```
User uploads image
        │
        ▼
Node.js Express (port 3000)
        │  POST image file
        ▼
Python Flask CNN Service (port 5000)
        │  MobileNetV2 inference
        ▼
Predicted: plant_type + disease_name + confidence
        │
        ▼
Node.js maps to disease DB → returns full disease info
```

---

## Step 1: Download the PlantVillage Dataset

1. Go to: https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset
2. Download and extract the dataset
3. Place it so the structure looks like:

```
cnn_model/
  dataset/
    PlantVillage/
      Apple___Apple_scab/
        image1.JPG
        image2.JPG
      Apple___healthy/
      Corn_(maize)___Common_rust_/
      Tomato___Early_blight/
      ...
```

---

## Step 2: Install Python Dependencies

```bash
cd smart-plant-care/cnn_model
pip install -r requirements.txt
```

> **Requirements:** Python 3.8+, TensorFlow 2.10+, Flask, Pillow, NumPy

---

## Step 3: Train the CNN Model

```bash
python train_model.py
```

This will:
- Load 54,000+ leaf images from the PlantVillage dataset
- Build a MobileNetV2 CNN with a custom classification head
- Apply data augmentation (rotation, flip, zoom, shift)
- Train in 2 phases:
  - **Phase 1** (20 epochs): Classification head only, base frozen
  - **Phase 2** (10 epochs): Fine-tune top 30 MobileNetV2 layers
- Save the trained model to `saved_model/plant_disease_model.h5`
- Save class labels to `saved_model/class_labels.json`

Training takes ~30–90 minutes depending on your GPU/CPU.

---

## Step 4: Start the CNN Microservice

```bash
# In one terminal window:
python app.py
# → CNN service running at http://localhost:5000
```

---

## Step 5: Start the Node.js App

```bash
# In another terminal window:
cd smart-plant-care
npm install
npm start
# → App running at http://localhost:3000
```

---

## How Detection Works

When a user uploads a leaf image:

| Step | What Happens |
|---|---|
| **1. CNN Inference** | Image sent to Flask service → MobileNetV2 predicts plant + disease |
| **2. DB Mapping** | Prediction matched to disease database (exact → partial → fuzzy) |
| **3. Fallback** | If CNN service is down or model not trained, hash-based detection is used automatically |

The API response includes a `detectionMethod` field:
- `"cnn"` — real CNN prediction was used ✅
- `"hash-fallback"` — fallback was used (CNN unavailable) ⚠️

---

## Test the CNN Directly

```bash
# Test a single image from command line
python predict.py --image path/to/leaf_image.jpg

# Test via curl
curl -X POST -F "image=@tomato_leaf.jpg" http://localhost:5000/predict

# Health check
curl http://localhost:5000/health
```

---

## Supported Plants & Diseases (CNN)

| Plant | Diseases Detected by CNN |
|---|---|
| Tomato | Early Blight, Late Blight, Bacterial Spot, Leaf Mold, Septoria Leaf Spot, Spider Mites, Target Spot, Yellow Leaf Curl Virus, Mosaic Virus, Healthy |
| Potato | Early Blight, Late Blight, Healthy |
| Apple | Apple Scab, Black Rot, Cedar Apple Rust, Healthy |
| Grape | Black Rot, Black Measles, Leaf Blight, Healthy |
| Corn | Gray Leaf Spot, Common Rust, Northern Leaf Blight, Healthy |
| Strawberry | Leaf Scorch, Healthy |
| Pepper | Bacterial Spot, Healthy |
| Cherry | Powdery Mildew, Healthy |

> **Note:** Rice diseases are not in PlantVillage — they use hash-based fallback automatically.

---

## Files

| File | Description |
|---|---|
| `train_model.py` | CNN training script (MobileNetV2 + Transfer Learning) |
| `app.py` | Flask REST API microservice for CNN predictions |
| `predict.py` | Command-line tool to test predictions |
| `requirements.txt` | Python dependencies |
| `saved_model/` | Auto-created after training (model + labels) |
| `dataset/` | Place PlantVillage dataset here |
