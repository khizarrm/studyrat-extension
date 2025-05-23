from flask import Flask, request, jsonify
import pickle
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer
from flask_cors import CORS

# Load trained model and vectorizer
with open("model.pkl", "rb") as f:
    model = pickle.load(f)

with open("vectorizer.pkl", "rb") as f:
    vectorizer = pickle.load(f)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        text = data.get("text", "")
        if not text:
            return jsonify({"error": "No text provided"}), 400

        # Transform text to TF-IDF vector
        X_new = vectorizer.transform([text])
        prediction = model.predict(X_new)[0]

        return jsonify({"productive": bool(prediction)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000)
