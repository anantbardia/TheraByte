"""
TheraByte AI — Custom Model Training Pipeline
Trains 3 specialized ML classifiers for mental health analysis:
  1. Crisis Detection (binary: crisis / safe)
  2. Emotion Classification (multi-class: 8 emotions)
  3. Cognitive Distortion Detection (multi-label: 10 distortions)

All models use TF-IDF + SVM/Logistic Regression for lightweight local inference.
No GPU needed. Runs on any machine.
"""

import json
import os
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVC, LinearSVC
from sklearn.linear_model import LogisticRegression
from sklearn.multiclass import OneVsRestClassifier
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

# ═══════════════════════════════════════════════════════════
# TRAINING DATA — Mental Health Domain
# ═══════════════════════════════════════════════════════════

CRISIS_DATA = {
    "texts": [
        # === CRISIS (label=1) ===
        "I want to kill myself", "I don't want to be alive anymore", "I'm going to end it all",
        "I've been thinking about suicide a lot", "I want to die", "Life isn't worth living",
        "I'm going to take all my pills tonight", "Nobody would miss me if I was gone",
        "I've written my goodbye letters", "I'm planning to jump off the bridge",
        "I've been cutting myself every night", "I want to hurt myself so badly",
        "I'm going to hang myself", "This is my final goodbye", "I can't go on anymore",
        "Everything would be better if I wasn't here", "I'm a burden to everyone",
        "The world would be better without me", "I've decided to end my life",
        "I'm stockpiling pills", "I don't see a future for myself at all",
        "I just want everything to stop permanently", "I've given away my belongings",
        "I keep thinking about overdosing", "Nothing will ever get better no matter what",
        "I'm going to disappear forever", "I have a plan to end things tonight",
        "I've been self harming more and more", "I wish I was never born",
        "There's no point in anything I do, I should just die",
        "I can't take this pain anymore, I want it to end permanently",
        "I'm saying goodbye to everyone I care about", "I feel trapped and death is the only way out",
        "I keep thinking about how to kill myself", "I've been looking up ways to die",
        
        # === SAFE (label=0) ===
        "I'm feeling stressed about my exams", "Work has been really overwhelming lately",
        "I had a fight with my friend", "I'm worried about my future",
        "I feel lonely sometimes", "My relationship is going through a rough patch",
        "I'm anxious about the presentation tomorrow", "I feel sad today",
        "I can't sleep well these days", "I'm frustrated with my job",
        "My parents don't understand me", "I feel like I'm falling behind my peers",
        "I need someone to talk to", "I'm having a bad day", "Everything feels hard right now",
        "I feel overwhelmed by responsibilities", "I'm not sure what to do with my career",
        "I miss my old friends", "I feel stuck in a rut", "I'm tired all the time",
        "My boss criticized me unfairly", "I keep comparing myself to others on social media",
        "I feel disconnected from people around me", "I'm nervous about starting college",
        "I had a panic attack at work but I'm okay now", "My confidence has been really low",
        "I keep procrastinating and I don't know why", "I feel like I'm not good enough",
        "I'm having trouble focusing on anything", "I just feel empty and bored",
        "I argued with my partner again", "I'm worried about my financial situation",
        "I don't enjoy things I used to enjoy", "My anxiety is making it hard to function",
        "I feel like nobody really knows me", "I've been eating poorly and not exercising",
        "I cried a lot today for no clear reason", "I'm struggling to manage my time",
        "I feel pressure from my family to succeed", "I'm dealing with grief after a loss",
    ],
    "labels": [
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    ]
}

EMOTION_DATA = {
    "texts": [
        # Anxiety
        "I'm so anxious about tomorrow", "My heart won't stop racing", "I keep worrying about everything",
        "I feel nervous all the time", "I can't stop overthinking", "What if everything goes wrong",
        "I feel jittery and on edge", "The anxiety is crushing me",
        # Sadness  
        "I feel so sad and empty", "I've been crying all day", "Nothing makes me happy anymore",
        "I feel like a failure", "I just want to cry", "Everything feels grey",
        "I feel hollow inside", "I miss how things used to be",
        # Anger
        "I'm so angry right now", "I can't control my rage", "Everything makes me furious",
        "I want to scream", "I hate everything about this situation", "I feel betrayed",
        "I'm fed up with everyone", "This is so unfair",
        # Fear
        "I'm terrified", "I'm scared of what's happening", "I feel paralyzed with fear",
        "I'm afraid I'll never recover", "I'm dreading tomorrow", "I feel unsafe",
        "Something bad is going to happen", "I can't face this",
        # Loneliness
        "I feel so alone", "Nobody understands me", "I have no one to talk to",
        "I feel invisible", "I'm surrounded by people but still lonely", "Nobody cares about me",
        "I feel disconnected from everyone", "I feel abandoned",
        # Overwhelm
        "I can't handle this anymore", "Everything is too much", "I'm drowning in responsibilities",
        "I feel crushed by the pressure", "I have no energy left", "I'm burnt out",
        "I feel like I'm going to break", "There's too much on my plate",
        # Confusion
        "I don't know what to do", "I feel lost", "I don't know who I am anymore",
        "I can't make any decisions", "I feel directionless", "Nothing makes sense",
        "I'm confused about everything", "I feel stuck between choices",
        # Hope
        "I think things might get better", "I had a good day today", "I feel a little hopeful",
        "I'm starting to feel better", "Something good happened", "I feel grateful",
        "I made progress today", "I feel lighter than before",
    ],
    "labels": [
        "anxiety","anxiety","anxiety","anxiety","anxiety","anxiety","anxiety","anxiety",
        "sadness","sadness","sadness","sadness","sadness","sadness","sadness","sadness",
        "anger","anger","anger","anger","anger","anger","anger","anger",
        "fear","fear","fear","fear","fear","fear","fear","fear",
        "loneliness","loneliness","loneliness","loneliness","loneliness","loneliness","loneliness","loneliness",
        "overwhelm","overwhelm","overwhelm","overwhelm","overwhelm","overwhelm","overwhelm","overwhelm",
        "confusion","confusion","confusion","confusion","confusion","confusion","confusion","confusion",
        "hope","hope","hope","hope","hope","hope","hope","hope",
    ]
}

DISTORTION_DATA = {
    "texts": [
        # All-or-nothing
        "I always fail at everything", "If I can't do it perfectly, there's no point",
        "Nothing ever goes right for me", "I'm a complete failure", "Everything is ruined",
        # Catastrophizing
        "This is going to be a disaster", "The worst thing possible will happen",
        "My life is over because of this", "Everything is falling apart completely",
        "This mistake will destroy my career",
        # Mind reading
        "Everyone thinks I'm stupid", "They probably hate me", "She must think I'm pathetic",
        "People are judging me all the time", "They're laughing at me behind my back",
        # Fortune telling
        "I'll never get better", "This will never change", "I'm going to fail the interview",
        "Nothing good is in my future", "I'll always be alone",
        # Should statements
        "I should be more productive", "I shouldn't feel this way", "I should have known better",
        "I must be perfect", "I ought to be further ahead in life",
        # Personalization
        "It's all my fault", "I caused this problem", "If I were better this wouldn't have happened",
        "Everyone's misery is because of me", "I'm the reason things went wrong",
        # Overgeneralization
        "This always happens to me", "Nobody ever listens", "I never do anything right",
        "Everyone always leaves me", "Things never work out",
        # Emotional reasoning
        "I feel stupid so I must be stupid", "I feel worthless so I am worthless",
        "I feel like a burden so I must be one", "I feel unlovable so nobody will love me",
        "I feel like I can't do it so I really can't",
        # Neutral (no distortion)
        "I'm working on a project", "I went for a walk today", "I talked to my friend",
        "I'm learning something new", "The weather is nice", "I cooked dinner",
        "I read a book", "I finished my homework", "I had coffee this morning",
        "I watched a movie last night",
    ],
    "labels": [
        ["all-or-nothing"],["all-or-nothing"],["all-or-nothing"],["all-or-nothing"],["all-or-nothing"],
        ["catastrophizing"],["catastrophizing"],["catastrophizing"],["catastrophizing"],["catastrophizing"],
        ["mind-reading"],["mind-reading"],["mind-reading"],["mind-reading"],["mind-reading"],
        ["fortune-telling"],["fortune-telling"],["fortune-telling"],["fortune-telling"],["fortune-telling"],
        ["should-statements"],["should-statements"],["should-statements"],["should-statements"],["should-statements"],
        ["personalization"],["personalization"],["personalization"],["personalization"],["personalization"],
        ["overgeneralization"],["overgeneralization"],["overgeneralization"],["overgeneralization"],["overgeneralization"],
        ["emotional-reasoning"],["emotional-reasoning"],["emotional-reasoning"],["emotional-reasoning"],["emotional-reasoning"],
        [],[],[],[],[],[],[],[],[],[],
    ]
}


# ═══════════════════════════════════════════════════════════
# TRAINING FUNCTIONS
# ═══════════════════════════════════════════════════════════

def train_crisis_model():
    """Train binary crisis detection classifier."""
    print("[CRISIS] Training Crisis Detection Model...")
    pipe = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 3), max_features=5000, sublinear_tf=True)),
        ('clf', SVC(kernel='rbf', C=10, gamma='scale', probability=True))
    ])
    X, y = CRISIS_DATA["texts"], CRISIS_DATA["labels"]
    scores = cross_val_score(pipe, X, y, cv=3, scoring='f1')
    print(f"   Cross-val F1: {scores.mean():.3f} (+/- {scores.std():.3f})")
    pipe.fit(X, y)
    path = os.path.join(MODELS_DIR, "crisis_detector.joblib")
    joblib.dump(pipe, path)
    print(f"   [OK] Saved to {path}")
    return pipe


def train_emotion_model():
    """Train multi-class emotion classifier."""
    print("[EMOTION] Training Emotion Classifier...")
    pipe = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True)),
        ('clf', LogisticRegression(C=5, max_iter=1000, solver='lbfgs'))
    ])
    X, y = EMOTION_DATA["texts"], EMOTION_DATA["labels"]
    scores = cross_val_score(pipe, X, y, cv=3, scoring='accuracy')
    print(f"   Cross-val Accuracy: {scores.mean():.3f} (+/- {scores.std():.3f})")
    pipe.fit(X, y)
    path = os.path.join(MODELS_DIR, "emotion_classifier.joblib")
    joblib.dump(pipe, path)
    print(f"   ✅ Saved to {path}")
    return pipe


def train_distortion_model():
    """Train multi-label cognitive distortion detector."""
    print("[DISTORTION] Training Distortion Detector...")
    
    mlb = MultiLabelBinarizer()
    X = DISTORTION_DATA["texts"]
    y_raw = DISTORTION_DATA["labels"]
    y = mlb.fit_transform(y_raw)
    
    pipe = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True)),
        ('clf', OneVsRestClassifier(LinearSVC(C=1, max_iter=2000)))
    ])
    pipe.fit(X, y)
    
    path_model = os.path.join(MODELS_DIR, "distortion_detector.joblib")
    path_mlb = os.path.join(MODELS_DIR, "distortion_labels.joblib")
    joblib.dump(pipe, path_model)
    joblib.dump(mlb, path_mlb)
    print(f"   [OK] Saved to {path_model}")
    print(f"   Labels: {list(mlb.classes_)}")
    return pipe, mlb


def train_all():
    """Train all 3 models."""
    print("=" * 60)
    print("TheraByte AI — Custom Model Training")
    print("=" * 60)
    crisis = train_crisis_model()
    emotion = train_emotion_model()
    distortion, mlb = train_distortion_model()
    print("=" * 60)
    print("[DONE] All models trained and saved!")
    print(f"   Models directory: {MODELS_DIR}")
    
    # Quick test
    print("\n[TEST] Quick Test:")
    test_texts = [
        "I want to kill myself",
        "I'm feeling anxious about my exam",
        "I always fail at everything",
    ]
    for t in test_texts:
        c = crisis.predict_proba([t])[0]
        e = emotion.predict([t])[0]
        d_pred = distortion.predict([t])
        d_labels = mlb.inverse_transform(d_pred)
        print(f"   \"{t[:50]}...\"")
        print(f"      Crisis: {c[1]:.2%} | Emotion: {e} | Distortions: {d_labels[0]}")
    
    return crisis, emotion, distortion, mlb


if __name__ == "__main__":
    train_all()
