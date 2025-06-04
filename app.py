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

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if not model or not vectorizer:
            return jsonify({"error": "Model not loaded. Please train the model first."}), 500

        data = request.get_json()
        text = data.get("text", "")
        if not text:
            return jsonify({"error": "No text provided"}), 400

        # Extract media fields (default to 0 if missing)
        img_count     = int(data.get("image_count", 0))
        vid_count     = int(data.get("video_count", 0))
        gif_count     = int(data.get("gif_count", 0))
        density       = float(data.get("media_density_ratio", 0.0))

        # 1) TF-IDF → dense array
        text_vect = vectorizer.transform([text]).toarray()  # shape: (1, 5000)

        # 2) Normalize media features exactly as in retraining
        n_img     = min(img_count, 50) / 50.0
        n_vid     = min(vid_count, 50) / 50.0
        n_gif     = min(gif_count, 50) / 50.0
        n_density = min(density, 10.0) / 10.0
        media_vect = np.array([[n_img, n_vid, n_gif, n_density]])  # shape: (1, 4)

        # 3) Concatenate TF-IDF + media features
        X_combined = np.concatenate([text_vect, media_vect], axis=1)  # shape: (1, 5004)

        # 4) Make prediction
        pred = model.predict(X_combined)[0]
        return jsonify({"productive": bool(pred)})
    except Exception as e:
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

        if result.error:
            # If Supabase client library returned an error, raise it
            raise Exception(f"Supabase returned error")

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
    """Retrain the ML model with text + media features"""
    try:
        print("Starting model retraining with media features...")

        # Fetch ALL data from Supabase including media features
        productive_data = supabase.table('productive').select(
            'content', 'image_count', 'video_count', 'gif_count', 'media_density_ratio'
        ).execute()
        unproductive_data = supabase.table('unproductive').select(
            'content', 'image_count', 'video_count', 'gif_count', 'media_density_ratio'
        ).execute()

        # Convert to feature arrays with NULL handling
        productive_texts = []
        productive_media = []
        for item in productive_data.data:
            productive_texts.append(item['content'])
            # Handle NULL values by defaulting to 0, then apply fixed-scale normalization
            img_count = item.get('image_count') or 0
            vid_count = item.get('video_count') or 0
            gif_count = item.get('gif_count') or 0
            density = item.get('media_density_ratio') or 0.0
            
            # Apply fixed-scale normalization (max=50 for counts, max=10 for density)
            normalized_media = [
                min(img_count, 50) / 50.0,      # Image count normalized to [0,1]
                min(vid_count, 50) / 50.0,      # Video count normalized to [0,1]
                min(gif_count, 50) / 50.0,      # GIF count normalized to [0,1]
                min(density, 10.0) / 10.0       # Density ratio normalized to [0,1]
            ]
            productive_media.append(normalized_media)
        
        unproductive_texts = []
        unproductive_media = []
        for item in unproductive_data.data:
            unproductive_texts.append(item['content'])
            # Handle NULL values by defaulting to 0, then apply fixed-scale normalization
            img_count = item.get('image_count') or 0
            vid_count = item.get('video_count') or 0
            gif_count = item.get('gif_count') or 0
            density = item.get('media_density_ratio') or 0.0
            
            # Apply fixed-scale normalization (max=50 for counts, max=10 for density)
            normalized_media = [
                min(img_count, 50) / 50.0,      # Image count normalized to [0,1]
                min(vid_count, 50) / 50.0,      # Video count normalized to [0,1]
                min(gif_count, 50) / 50.0,      # GIF count normalized to [0,1]
                min(density, 10.0) / 10.0       # Density ratio normalized to [0,1]
            ]
            unproductive_media.append(normalized_media)
        
        if not productive_texts or not unproductive_texts:
            return jsonify({"error": "Insufficient data for training"}), 400
        
        print(f"Training with {len(productive_texts)} productive and {len(unproductive_texts)} unproductive samples")
        print(f"Media features enabled: image_count, video_count, gif_count, media_density_ratio")
        
        # Combine all text and media data
        all_texts = productive_texts + unproductive_texts
        all_media = productive_media + unproductive_media
        labels = [1] * len(productive_texts) + [0] * len(unproductive_texts)
        
        # Create TF-IDF features from text
        print("Generating TF-IDF features...")
        new_vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
        text_features = new_vectorizer.fit_transform(all_texts)
        
        # Convert sparse matrix to dense for concatenation
        text_features_dense = text_features.toarray()  # Shape: (n_samples, 5000)
        media_features_array = np.array(all_media)     # Shape: (n_samples, 4)
        
        # Concatenate text and media features
        print("Combining text and media features...")
        combined_features = np.concatenate([text_features_dense, media_features_array], axis=1)
        print(f"Combined feature matrix shape: {combined_features.shape}")  # Should be (n_samples, 5004)
        
        # Train the enhanced model
        print("Training enhanced LogisticRegression model...")
        new_model = LogisticRegression(random_state=42, max_iter=1000)
        X_train, X_test, y_train, y_test = train_test_split(
            combined_features, labels, test_size=0.2, random_state=42
        )
        new_model.fit(X_train, y_train)
        
        # Calculate accuracy
        train_accuracy = accuracy_score(y_train, new_model.predict(X_train))
        test_accuracy = accuracy_score(y_test, new_model.predict(X_test))
        
        print(f"Training accuracy: {train_accuracy:.4f}")
        print(f"Test accuracy: {test_accuracy:.4f}")
        
        # Get feature importance for media features (last 4 coefficients)
        media_coefficients = new_model.coef_[0][-4:]  # Last 4 features are media
        media_importance = {
            "image_importance": float(abs(media_coefficients[0])),
            "video_importance": float(abs(media_coefficients[1])),
            "gif_importance": float(abs(media_coefficients[2])),
            "density_importance": float(abs(media_coefficients[3]))
        }
        
        # Backup old model files
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        if os.path.exists("model.pkl"):
            os.rename("model.pkl", f"model_backup_{timestamp}.pkl")
        if os.path.exists("vectorizer.pkl"):
            os.rename("vectorizer.pkl", f"vectorizer_backup_{timestamp}.pkl")
        
        # Save new model files
        print("Saving enhanced model and vectorizer...")
        with open("model.pkl", "wb") as f:
            pickle.dump(new_model, f)
        with open("vectorizer.pkl", "wb") as f:
            pickle.dump(new_vectorizer, f)
        
        # Update global model variables
        global model, vectorizer
        model = new_model
        vectorizer = new_vectorizer
        
        # Mark all data as trained
        supabase.table('productive').update({"trained": True}).neq("id", 0).execute()
        supabase.table('unproductive').update({"trained": True}).neq("id", 0).execute()
        
        # Log training history with media feature stats
        model_version = f"v{timestamp}_media_enhanced"
        supabase.table('training_history').insert({
            "trained_at": datetime.datetime.now().isoformat(),
            "productive_count": len(productive_texts),
            "unproductive_count": len(unproductive_texts),
            "model_version": model_version,
        }).execute()
        
        print("Enhanced model retraining completed successfully")
        
        return jsonify({
            "message": "Enhanced model retrained successfully with media features",
            "model_version": model_version,
            "training_data": {
                "productive_samples": len(productive_texts),
                "unproductive_samples": len(unproductive_texts),
                "total_samples": len(all_texts),
                "feature_count": combined_features.shape[1]
            },
            "accuracy": {
                "train_accuracy": float(train_accuracy),
                "test_accuracy": float(test_accuracy)
            },
            "media_feature_importance": media_importance,
            "enhancement": "Media features (image, video, gif, density) now included",
            "trained_at": datetime.datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error during enhanced retraining: {e}")
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