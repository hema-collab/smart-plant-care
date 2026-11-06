"""
CNN Plant Disease Detection - Model Training Script
====================================================
Trains a MobileNetV2-based CNN on the PlantVillage dataset for plant disease classification.

Usage:
    1. Download the PlantVillage dataset from Kaggle:
       https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset
    2. Extract into: cnn_model/dataset/
       The folder structure should be:
         dataset/
           PlantVillage/
             Apple___Apple_scab/
             Apple___healthy/
             Corn_(maize)___Common_rust_/
             ...
    3. Run: python train_model.py
"""

import os
import json
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import (
    GlobalAveragePooling2D, Dense, Dropout, Input
)
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import (
    EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
)

# ── Configuration ──────────────────────────────────────────────────────────────
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 20
LEARNING_RATE = 0.0001
VALIDATION_SPLIT = 0.2

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(SCRIPT_DIR, "dataset", "PlantVillage", "archive", "plantvillage dataset", "color")
SAVED_MODEL_DIR = os.path.join(SCRIPT_DIR, "saved_model")
MODEL_PATH = os.path.join(SAVED_MODEL_DIR, "plant_disease_model.h5")
LABELS_PATH = os.path.join(SAVED_MODEL_DIR, "class_labels.json")

# Mapping from PlantVillage folder names → (plant_type, disease_name)
# This maps CNN predictions back to your existing disease database
CLASS_NAME_MAP = {
    "Apple___Apple_scab":                       {"plant": "Apple",      "disease": "Apple Scab"},
    "Apple___Black_rot":                        {"plant": "Apple",      "disease": "Black Rot"},
    "Apple___Cedar_apple_rust":                 {"plant": "Apple",      "disease": "Cedar Apple Rust"},
    "Apple___healthy":                          {"plant": "Apple",      "disease": "Healthy"},
    "Blueberry___healthy":                      {"plant": "Blueberry",  "disease": "Healthy"},
    "Cherry_(including_sour)___Powdery_mildew": {"plant": "Cherry",     "disease": "Powdery Mildew"},
    "Cherry_(including_sour)___healthy":        {"plant": "Cherry",     "disease": "Healthy"},
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {"plant": "Corn", "disease": "Gray Leaf Spot"},
    "Corn_(maize)___Common_rust_":              {"plant": "Corn",       "disease": "Common Rust"},
    "Corn_(maize)___Northern_Leaf_Blight":      {"plant": "Corn",       "disease": "Northern Leaf Blight"},
    "Corn_(maize)___healthy":                   {"plant": "Corn",       "disease": "Healthy"},
    "Grape___Black_rot":                        {"plant": "Grape",      "disease": "Black Rot"},
    "Grape___Esca_(Black_Measles)":             {"plant": "Grape",      "disease": "Black Measles"},
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {"plant": "Grape",    "disease": "Leaf Blight"},
    "Grape___healthy":                          {"plant": "Grape",      "disease": "Healthy"},
    "Orange___Haunglongbing_(Citrus_greening)": {"plant": "Orange",     "disease": "Citrus Greening"},
    "Peach___Bacterial_spot":                   {"plant": "Peach",      "disease": "Bacterial Spot"},
    "Peach___healthy":                          {"plant": "Peach",      "disease": "Healthy"},
    "Pepper,_bell___Bacterial_spot":            {"plant": "Pepper",     "disease": "Bacterial Spot"},
    "Pepper,_bell___healthy":                   {"plant": "Pepper",     "disease": "Healthy"},
    "Potato___Early_blight":                    {"plant": "Potato",     "disease": "Early Blight"},
    "Potato___Late_blight":                     {"plant": "Potato",     "disease": "Late Blight"},
    "Potato___healthy":                         {"plant": "Potato",     "disease": "Healthy"},
    "Raspberry___healthy":                      {"plant": "Raspberry",  "disease": "Healthy"},
    "Soybean___healthy":                        {"plant": "Soybean",    "disease": "Healthy"},
    "Squash___Powdery_mildew":                  {"plant": "Squash",     "disease": "Powdery Mildew"},
    "Strawberry___Leaf_scorch":                 {"plant": "Strawberry", "disease": "Leaf Scorch"},
    "Strawberry___healthy":                     {"plant": "Strawberry", "disease": "Healthy"},
    "Tomato___Bacterial_spot":                  {"plant": "Tomato",     "disease": "Bacterial Spot"},
    "Tomato___Early_blight":                    {"plant": "Tomato",     "disease": "Early Blight"},
    "Tomato___Late_blight":                     {"plant": "Tomato",     "disease": "Late Blight"},
    "Tomato___Leaf_Mold":                       {"plant": "Tomato",     "disease": "Leaf Mold"},
    "Tomato___Septoria_leaf_spot":              {"plant": "Tomato",     "disease": "Septoria Leaf Spot"},
    "Tomato___Spider_mites Two-spotted_spider_mite": {"plant": "Tomato", "disease": "Spider Mites"},
    "Tomato___Target_Spot":                     {"plant": "Tomato",     "disease": "Target Spot"},
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus":   {"plant": "Tomato",     "disease": "Yellow Leaf Curl Virus"},
    "Tomato___Tomato_mosaic_virus":             {"plant": "Tomato",     "disease": "Mosaic Virus"},
    "Tomato___healthy":                         {"plant": "Tomato",     "disease": "Healthy"},
}


def build_model(num_classes):
    """
    Build CNN model using MobileNetV2 with Transfer Learning.

    Architecture:
        MobileNetV2 (pre-trained on ImageNet, frozen base)
        → GlobalAveragePooling2D
        → Dense(128, ReLU)
        → Dropout(0.3)
        → Dense(num_classes, Softmax)
    """
    # Load MobileNetV2 base (without top classification layers)
    base_model = MobileNetV2(
        weights="imagenet",
        include_top=False,
        input_shape=(IMG_SIZE, IMG_SIZE, 3)
    )

    # Freeze the base model layers (use as feature extractor)
    base_model.trainable = False

    # Build classification head
    inputs = Input(shape=(IMG_SIZE, IMG_SIZE, 3))
    x = base_model(inputs, training=False)
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation="relu")(x)
    x = Dropout(0.3)(x)
    outputs = Dense(num_classes, activation="softmax")(x)

    model = Model(inputs, outputs)
    return model, base_model


def main():
    print("=" * 60)
    print("  CNN Plant Disease Detection - Model Training")
    print("  Architecture: MobileNetV2 + Transfer Learning")
    print("=" * 60)

    # ── Validate dataset path ──────────────────────────────────────────────
    if not os.path.isdir(DATASET_DIR):
        print(f"\n[ERROR] Dataset not found at: {DATASET_DIR}")
        print("\nPlease download the PlantVillage dataset from Kaggle:")
        print("  https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset")
        print(f"\nExtract it so that folders like 'Apple___Apple_scab/' are inside:")
        print(f"  {DATASET_DIR}")
        return

    # ── Load dataset with data augmentation ────────────────────────────────
    print("\n[1/5] Loading dataset with data augmentation...")

    train_datagen = tf.keras.preprocessing.image.ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=25,
        width_shift_range=0.15,
        height_shift_range=0.15,
        shear_range=0.1,
        zoom_range=0.2,
        horizontal_flip=True,
        vertical_flip=False,
        fill_mode="nearest",
        validation_split=VALIDATION_SPLIT,
    )

    train_generator = train_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        subset="training",
        shuffle=True,
        seed=42,
    )

    val_generator = train_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        subset="validation",
        shuffle=False,
        seed=42,
    )

    num_classes = train_generator.num_classes
    class_indices = train_generator.class_indices  # folder_name → index

    print(f"   Found {train_generator.samples} training images")
    print(f"   Found {val_generator.samples} validation images")
    print(f"   Number of classes: {num_classes}")

    # ── Build model ────────────────────────────────────────────────────────
    print("\n[2/5] Building MobileNetV2 model...")
    model, base_model = build_model(num_classes)

    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    model.summary()

    # ── Training callbacks ─────────────────────────────────────────────────
    os.makedirs(SAVED_MODEL_DIR, exist_ok=True)

    callbacks = [
        EarlyStopping(
            monitor="val_accuracy",
            patience=5,
            restore_best_weights=True,
            verbose=1,
        ),
        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=3,
            min_lr=1e-7,
            verbose=1,
        ),
        ModelCheckpoint(
            MODEL_PATH,
            monitor="val_accuracy",
            save_best_only=True,
            verbose=1,
        ),
    ]

    # ── Phase 1: Train classification head (base frozen) ───────────────────
    print("\n[3/5] Phase 1: Training classification head (base frozen)...")
    history1 = model.fit(
        train_generator,
        validation_data=val_generator,
        epochs=EPOCHS,
        callbacks=callbacks,
        verbose=1,
    )

    # ── Phase 2: Fine-tune top layers of base model ────────────────────────
    print("\n[4/5] Phase 2: Fine-tuning top layers of MobileNetV2...")

    # Unfreeze the last 30 layers of the base model for fine-tuning
    base_model.trainable = True
    for layer in base_model.layers[:-30]:
        layer.trainable = False

    # Recompile with a lower learning rate for fine-tuning
    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE / 10),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    history2 = model.fit(
        train_generator,
        validation_data=val_generator,
        epochs=10,
        callbacks=callbacks,
        verbose=1,
    )

    # ── Save class labels mapping ──────────────────────────────────────────
    print("\n[5/5] Saving model and class labels...")

    # Invert: index → folder_name, then enrich with plant/disease names
    index_to_class = {v: k for k, v in class_indices.items()}
    class_labels = {}
    for idx, folder_name in index_to_class.items():
        mapping = CLASS_NAME_MAP.get(folder_name, {
            "plant": folder_name.split("___")[0].replace("_", " "),
            "disease": folder_name.split("___")[1].replace("_", " ") if "___" in folder_name else "Unknown"
        })
        class_labels[str(idx)] = {
            "folder": folder_name,
            "plant": mapping["plant"],
            "disease": mapping["disease"],
        }

    with open(LABELS_PATH, "w") as f:
        json.dump(class_labels, f, indent=2)

    # ── Final evaluation ───────────────────────────────────────────────────
    val_loss, val_accuracy = model.evaluate(val_generator, verbose=0)
    print(f"\n{'=' * 60}")
    print(f"  Training Complete!")
    print(f"  Final Validation Accuracy: {val_accuracy * 100:.2f}%")
    print(f"  Final Validation Loss:     {val_loss:.4f}")
    print(f"  Model saved to:            {MODEL_PATH}")
    print(f"  Class labels saved to:     {LABELS_PATH}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
