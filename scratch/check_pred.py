import cv2
import numpy as np
import tensorflow as tf
import os

# Load model
legacy_model_path = r"d:\xampp\htdocs\UMSA\iA\modelo_ml\model\3"
try:
    tfsmlayer = tf.keras.layers.TFSMLayer(legacy_model_path, call_endpoint='serving_default')
    inputs = tf.keras.Input(shape=(256, 256, 3))
    outputs = tfsmlayer(inputs)
    model = tf.keras.Model(inputs, outputs)
    print("Model loaded with TFSMLayer")
except Exception as e:
    print("TFSMLayer failed, loading with load_model:", e)
    model = tf.keras.models.load_model(legacy_model_path)

CLASES_MODELO = [
    "apple_level_0",
    "apple_level_1",
    "apple_level_2",
    "potato_level_0",
    "potato_level_1",
    "potato_level_2"
]

# Image paths
img_orig_path = r"d:\xampp\htdocs\UMSA\iA\proyecto-ganaderia\analyze\manzana-level_2-00001\originales\vista_1.jpg"
img_crop_path = r"d:\xampp\htdocs\UMSA\iA\proyecto-ganaderia\analyze\manzana-level_2-00001\recortadas\recorte_1.png"

def predict_and_print(path, name):
    img = cv2.imread(path)
    if img is None:
        print(f"Failed to read image {path}")
        return
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img_resized = cv2.resize(img_rgb, (256, 256))
    img_batch = np.expand_dims(img_resized.astype(np.float32), axis=0)
    
    preds = model.predict(img_batch, verbose=0)
    if isinstance(preds, dict):
        first_key = list(preds.keys())[0]
        logits = preds[first_key][0]
    else:
        logits = preds[0]
        
    print(f"\n--- Prediction for {name} ({path}) ---")
    for cls, prob in zip(CLASES_MODELO, logits):
        print(f"  {cls}: {prob:.6f}")
    pred_idx = np.argmax(logits)
    print(f"Winner: {CLASES_MODELO[pred_idx]} with prob {logits[pred_idx]:.6f}")

predict_and_print(img_orig_path, "Original")
predict_and_print(img_crop_path, "Crop")
