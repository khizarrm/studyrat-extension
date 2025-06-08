from flask import Flask, request, jsonify
import pickle
import os
import datetime
import numpy as np 
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from flask_cors import CORS
from supabase import create_client
from sklearn.preprocessing import StandardScaler

# Load trained model and vectorizer
def load_model():
    try:
        with open("model.pkl", "rb") as f:
            model = pickle.load(f)
        with open("vectorizer.pkl", "rb") as f:
            vectorizer = pickle.load(f)
        return model, vectorizer
    except FileNotFoundError:
        print("Model files not found. Please train the model first.")
        return None, None

model, vectorizer = load_model()

# Supabase setup
supabase = create_client(
    "https://wqctfgpsgexwlykqyafq.supabase.co", 
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxY3RmZ3BzZ2V4d2x5a3F5YWZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0ODYzODcsImV4cCI6MjA2MzA2MjM4N30.GiW8iRC8Tj64e-QX5OHQZGs0hxC2EzjDrTAH0d_eW3Y"
)

# Load all model artifacts when your Flask app starts
try:
    with open("model.pkl", "rb") as f:
        model = pickle.load(f)
    with open("vectorizer.pkl", "rb") as f:
        vectorizer = pickle.load(f)
    with open("media_scaler.pkl", "rb") as f:
        media_scaler = pickle.load(f) # Load the scaler
except FileNotFoundError:
    model, vectorizer, media_scaler = None, None, None

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

import numpy as np
from flask import request, jsonify

@app.route("/predict", methods=["POST"])
def predict():
    """
    Make a prediction using the model with scaled media features.
    """
    try:
        # Ensure all components are loaded
        if not model or not vectorizer or not media_scaler:
            return jsonify({"error": "Model, vectorizer, or scaler not loaded. Please train the model first."}), 500

        data = request.get_json()
        text = data.get("text", "")
        if not text:
            return jsonify({"error": "No text provided"}), 400

        # Extract media fields (default to 0 if missing)
        img_count = int(data.get("image_count", 0))
        vid_count = int(data.get("video_count", 0))
        gif_count = int(data.get("gif_count", 0))
        density = float(data.get("media_density_ratio", 0.0))

        # --- Feature Preparation ---
        # 1) Transform text using the loaded TF-IDF vectorizer
        text_vect = vectorizer.transform([text]).toarray()  # Shape: (1, 5000)

        # 2) Create a NumPy array for the media features
        media_features = np.array([[img_count, vid_count, gif_count, density]]) # Shape: (1, 4)

        # 3) Scale the media features using the loaded StandardScaler
        scaled_media_features = media_scaler.transform(media_features) # Shape: (1, 4)

        # 4) Concatenate TF-IDF and scaled media features
        X_combined = np.concatenate([text_vect, scaled_media_features], axis=1)  # Shape: (1, 5004)

        # --- Prediction ---
        # 5) Make a prediction with the combined feature vector
        pred = model.predict(X_combined)[0]
        return jsonify({"productive": bool(pred)})

    except Exception as e:
        print("Prediction Error: ", e)
        return jsonify({"error": str(e)}), 500

@app.route("/feedback", methods=["POST"])
def feedback():
    try:
        data = request.get_json()
        print("→ /feedback raw JSON:", data)

        text = data.get("text", "")
        is_productive = data.get("is_productive")
        if not text:
            return jsonify({"error": "No text provided"}), 400
        if is_productive is None:
            return jsonify({"error": "is_productive field required"}), 400

        img_count     = data.get("image_count", 0)
        vid_count     = data.get("video_count", 0)
        gif_count     = data.get("gif_count", 0)
        media_density = data.get("media_density_ratio", 0.0)

        table_name = "productive" if is_productive else "unproductive"

        existing = supabase.table(table_name).select("id").eq("content", text).execute()
        if len(existing.data) > 0:
            return jsonify({
                "message": "Content already exists in dataset",
                "table": table_name,
                "duplicate": True
            })

        payload = {
            "content": text,
            "image_count": int(img_count),
            "video_count": int(vid_count),
            "trained": False,
            "gif_count": int(gif_count),
            "media_density_ratio": float(media_density)
        }
        print("adding to Supabase…")
        result = supabase.table(table_name).insert(payload).execute()
        print("Supabase result.data:", result.data)
        
        return jsonify({
            "message": "Feedback added successfully",
            "table": table_name,
            "id": result.data[0]["id"],
            "duplicate": False
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/admin/untrained-stats", methods=["GET"])
def get_untrained_stats():
    """Get statistics about untrained data"""
    try:
        # Count untrained data in both tables
        productive_untrained = supabase.table("productive").select("*", count="exact", head=True).eq("trained", False).execute()
        unproductive_untrained = supabase.table("unproductive").select("*", count="exact", head=True).eq("trained", False).execute()
        
        # Get last training time from training_history
        last_training = supabase.table("training_history").select("trained_at").order("trained_at", desc=True).limit(1).execute()
        
        untrained_productive = productive_untrained.count or 0
        untrained_unproductive = unproductive_untrained.count or 0
        total_untrained = untrained_productive + untrained_unproductive
        
        last_trained = None
        if last_training.data:
            last_trained = last_training.data[0]["trained_at"]
        
        return jsonify({
            "untrained_productive": untrained_productive,
            "untrained_unproductive": untrained_unproductive,
            "total_untrained": total_untrained,
            "last_trained": last_trained,
            "training_recommended": total_untrained >= 10
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/retrain-model", methods=["POST"])
def retrain_model():
    """
    Retrain the ML model with all data, then updates all used rows
    to set the 'trained' column to True.
    """
    # Declare global variables at the very top of the function
    global model, vectorizer, scaler

    try:
        print("Starting model retraining...")

        # Step 1: Fetch ALL data from Supabase
        print("Fetching all productive and unproductive data...")
        productive_data = supabase.table('productive').select(
            'id', 'content', 'image_count', 'video_count', 'gif_count', 'media_density_ratio'
        ).execute()
        unproductive_data = supabase.table('unproductive').select(
            'id', 'content', 'image_count', 'video_count', 'gif_count', 'media_density_ratio'
        ).execute()

        # --- Data preparation ---
        productive_texts = [item['content'] for item in productive_data.data]
        productive_media = [
            [
                item.get('image_count') or 0,
                item.get('video_count') or 0,
                item.get('gif_count') or 0,
                item.get('media_density_ratio') or 0.0
            ] for item in productive_data.data
        ]

        unproductive_texts = [item['content'] for item in unproductive_data.data]
        unproductive_media = [
            [
                item.get('image_count') or 0,
                item.get('video_count') or 0,
                item.get('gif_count') or 0,
                item.get('media_density_ratio') or 0.0
            ] for item in unproductive_data.data
        ]

        if not productive_texts or not unproductive_texts:
            return jsonify({"error": "Insufficient data for training"}), 400

        print(f"Training with {len(productive_texts)} productive and {len(unproductive_texts)} unproductive samples")

        # --- Feature Engineering & Model Training ---
        all_texts = productive_texts + unproductive_texts
        all_media = np.array(productive_media + unproductive_media)
        labels = [1] * len(productive_texts) + [0] * len(unproductive_texts)

        print("Generating TF-IDF features...")
        new_vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
        text_features = new_vectorizer.fit_transform(all_texts)
        text_features_dense = text_features.toarray()

        print("Scaling media features with StandardScaler...")
        media_scaler = StandardScaler()
        scaled_media_features = media_scaler.fit_transform(all_media)

        print("Combining text and media features...")
        combined_features = np.concatenate([text_features_dense, scaled_media_features], axis=1)

        print("Training enhanced LogisticRegression model...")
        new_model = LogisticRegression(random_state=42, max_iter=1000)
        X_train, X_test, y_train, y_test = train_test_split(
            combined_features, labels, test_size=0.2, random_state=42
        )
        new_model.fit(X_train, y_train)

        train_accuracy = accuracy_score(y_train, new_model.predict(X_train))
        test_accuracy = accuracy_score(y_test, new_model.predict(X_test))
        print(f"Test accuracy: {test_accuracy:.4f}")

        # --- Save Artifacts ---
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        if os.path.exists("model.pkl"):
            os.rename("model.pkl", f"model_backup_{timestamp}.pkl")
        if os.path.exists("vectorizer.pkl"):
            os.rename("vectorizer.pkl", f"vectorizer_backup_{timestamp}.pkl")
        if os.path.exists("media_scaler.pkl"):
            os.rename("media_scaler.pkl", f"media_scaler_backup_{timestamp}.pkl")

        print("Saving enhanced model, vectorizer, and scaler...")
        with open("model.pkl", "wb") as f:
            pickle.dump(new_model, f)
        with open("vectorizer.pkl", "wb") as f:
            pickle.dump(new_vectorizer, f)
        with open("media_scaler.pkl", "wb") as f:
            pickle.dump(media_scaler, f)

        # Update global model variables
        model = new_model
        vectorizer = new_vectorizer
        scaler = media_scaler
        
        # --- Mark all used data as trained ---
        print("Marking used data as trained in Supabase...")

        productive_ids = [item['id'] for item in productive_data.data]
        unproductive_ids = [item['id'] for item in unproductive_data.data]

        if productive_ids:
            supabase.table('productive').update({'trained': True}).in_('id', productive_ids).execute()
        if unproductive_ids:
            supabase.table('unproductive').update({'trained': True}).in_('id', unproductive_ids).execute()
        
        print("Data successfully marked as trained.")

        return jsonify({
            "message": "Model retrained and all data marked as trained.",
            "accuracy": {
                "train_accuracy": float(train_accuracy),
                "test_accuracy": float(test_accuracy)
            },
            "trained_at": datetime.datetime.now().isoformat()
        })

    except Exception as e:
        print(f"Error during retraining: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "vectorizer_loaded": vectorizer is not None,
        "supabase_connected": True
    })

if __name__ == "__main__":
    print("Starting Study Rat Flask Server...")
    print("Endpoints available:")
    print("  POST /predict - Get productivity prediction")
    print("  POST /feedback - Submit user feedback")
    print("  GET /admin/untrained-stats - Get untrained data statistics")
    print("  POST /admin/retrain-model - Retrain ML model")
    print("  GET /health - Health check")
    
    if not model or not vectorizer:
        print("⚠️  WARNING: Model files not found. Please train the model first.")
    else:
        print("✅ Model loaded successfully")
    
    app.run(port=5000, debug=True)