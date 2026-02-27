"""
TheraByte AI — Custom Model Inference
Loads trained models and provides prediction functions.
These run locally — no API key needed, instant results.
"""

import os
import joblib

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

# ═══════════════════════════════════════════════════════════
# Load Models (Lazy Loaded)
# ═══════════════════════════════════════════════════════════

_crisis_model = None
_emotion_model = None
_distortion_model = None
_distortion_labels = None
_models_loaded = False


def _load_models():
    global _crisis_model, _emotion_model, _distortion_model, _distortion_labels, _models_loaded
    if _models_loaded:
        return
        
    try:
        _crisis_model = joblib.load(os.path.join(MODELS_DIR, "crisis_detector.joblib"))
    except:
        pass
    try:
        _emotion_model = joblib.load(os.path.join(MODELS_DIR, "emotion_classifier.joblib"))
    except:
        pass
    try:
        _distortion_model = joblib.load(os.path.join(MODELS_DIR, "distortion_detector.joblib"))
        _distortion_labels = joblib.load(os.path.join(MODELS_DIR, "distortion_labels.joblib"))
    except:
        pass
        
    _models_loaded = True


# ═══════════════════════════════════════════════════════════
# Inference Functions
# ═══════════════════════════════════════════════════════════

def predict_crisis(text: str) -> dict:
    """
    Predict crisis probability for a given text.
    Returns: {"is_crisis": bool, "confidence": float, "risk_score": int}
    """
    _load_models()
    if _crisis_model is None:
        return {"is_crisis": False, "confidence": 0, "risk_score": 0, "model": "unavailable"}

    proba = _crisis_model.predict_proba([text])[0]
    crisis_prob = float(proba[1])
    is_crisis = crisis_prob > 0.5

    # Convert to 0-100 risk score
    risk_score = int(crisis_prob * 100)

    return {
        "is_crisis": is_crisis,
        "confidence": round(crisis_prob, 3),
        "risk_score": risk_score,
        "model": "therabyte-crisis-v1"
    }


def predict_emotion(text: str) -> dict:
    """
    Classify emotional tone of the text.
    Returns: {"label": str, "confidence": float}
    """
    _load_models()
    if _emotion_model is None:
        return {"emotion": "unknown", "confidence": 0, "model": "unavailable"}

    prediction = _emotion_model.predict([text])[0]
    probas = _emotion_model.predict_proba([text])[0]
    classes = _emotion_model.classes_

    # Build confidence map
    proba_map = {cls: round(float(p), 3) for cls, p in zip(classes, probas)}
    max_confidence = float(max(probas))

    return {
        "emotion": prediction,
        "confidence": round(max_confidence, 3),
        "all_probabilities": proba_map,
        "model": "therabyte-emotion-v1"
    }


def predict_distortions(text: str) -> list:
    """
    Detect cognitive distortions in the text.
    Returns: [{"distortion": str, "confidence": float}, ...]
    """
    _load_models()
    if _distortion_model is None or _distortion_labels is None:
        return {"distortions": [], "model": "unavailable"}

    prediction = _distortion_model.predict([text])
    labels = _distortion_labels.inverse_transform(prediction)

    detected = list(labels[0]) if labels[0] else []

    return {
        "distortions": detected,
        "model": "therabyte-distortion-v1"
    }


def analyze_message(text: str) -> dict:
    """
    Run ALL 3 models on a single message.
    This is the main function used by the chat endpoint.
    """
    crisis = predict_crisis(text)
    emotion = predict_emotion(text)
    distortions = predict_distortions(text)

    return {
        "crisis": crisis,
        "emotion": emotion,
        "distortions": distortions,
        "models_used": [
            "therabyte-crisis-v1",
            "therabyte-emotion-v1",
            "therabyte-distortion-v1"
        ]
    }
