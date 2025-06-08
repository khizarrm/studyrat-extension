# 🧠 SAGE AI Focus Extension

An intelligent Chrome extension powered by machine learning that helps students stay focused by automatically blocking unproductive websites and content.

## 🌟 Features

- **Smart Content Analysis**: Uses AI to analyze webpage text and media content
- **Real-time Blocking**: Instantly blocks unproductive websites and content
- **Learning System**: Improves accuracy through user feedback
- **Beautiful Interface**: Clean, modern popup with intuitive controls
- **Persistent Settings**: Remembers your preferences across browser sessions
- **Media-Aware**: Considers images, videos, and GIFs in productivity assessment

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v14 or higher)
- **Python** (v3.8 or higher)
- **Chrome Browser**
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/studyrat/sage-ai-extension.git
cd sage-ai-extension
```

### 2. Backend Setup (Python Flask Server)

#### Create Virtual Environment
```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

#### Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### Start the Flask Server
```bash
python app.py
```

The server will start at `http://127.0.0.1:5000`

### 3. Frontend Setup (Chrome Extension)

#### Install Node Dependencies
```bash
npm install
```

#### Build the Extension
```bash
npm run build
```

This creates a `build/` folder with the compiled extension files.

### 4. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `build/` folder from your project directory
5. The SAGE AI extension should now appear in your extensions list

## 📁 Project Structure

```
sage-ai-extension/
├── src/
│   ├── pages/
│   │   ├── Popup/           # Extension popup interface
│   │   ├── Content/         # Content script for webpage analysis
│   │   ├── Background/      # Background script for extension logic
│   │   ├── Options/         # Extension options page
│   │   └── Panel/           # Developer tools panel
│   ├── assets/              # Icons and static assets
│   └── manifest.json        # Extension manifest
├── build/                   # Compiled extension (generated)
├── app.py                   # Flask backend server
├── requirements.txt         # Python dependencies
├── package.json             # Node.js dependencies
└── webpack.config.js        # Build configuration
```

## 🛠️ Development

### Making Changes

1. **Frontend changes**: Edit files in `src/`, then run `npm run build`
2. **Backend changes**: Edit `app.py`, server auto-reloads in debug mode
3. **Extension reload**: Go to `chrome://extensions/` and click the refresh icon

### Available Scripts

```bash
npm run build          # Build extension for production
npm run dev            # Build extension for development
npm run watch          # Watch for changes and rebuild automatically
```

### Python Development

```bash
# Install development dependencies
pip install -r requirements.txt

# Run server in debug mode
python app.py

# The server includes these endpoints:
# POST /predict - Get productivity prediction
# POST /feedback - Submit user feedback  
# GET /admin/untrained-stats - View training data stats
# POST /admin/retrain-model - Retrain the AI model
# GET /health - Health check
```

## 📊 Machine Learning Model

SAGE AI uses a **Logistic Regression** model trained on:

- **Text Content**: Analyzed using TF-IDF vectorization (5000 features)
- **Media Features**: Image count, video count, GIF count, media density ratio
- **User Feedback**: Continuously learns from user corrections

### Model Features

- **Text Analysis**: 5000 TF-IDF features from webpage content
- **Media Analysis**: 4 normalized media features (0-1 scale)
- **Combined Features**: 5004 total features for prediction
- **Accuracy**: Typically 85-95% on test data

### Training the Model

1. Use the extension and provide feedback on predictions
2. Access the admin panel at `http://127.0.0.1:5000/admin/untrained-stats`
3. When you have 10+ new feedback samples, retrain the model
4. The model automatically improves with more data

## 🔧 Configuration

### Supabase Setup

The extension uses Supabase for data storage. Update the credentials in `app.py`:

```python
supabase = create_client(
    "YOUR_SUPABASE_URL", 
    "YOUR_SUPABASE_ANON_KEY"
)
```

### Database Tables

Required Supabase tables:
- `productive` - Stores productive content samples
- `unproductive` - Stores unproductive content samples  
- `training_history` - Tracks model training sessions

## 🎯 Usage

1. **Install and activate** the extension following the setup steps
2. **Start the Python server** (`python app.py`)
3. **Browse the web** normally - SAGE AI runs in the background
4. **Use the popup** to toggle focus mode on/off
5. **Provide feedback** when predictions are wrong to improve accuracy

### Extension States

- **🔒 Focus Active**: Blocking unproductive content
- **🔓 Focus Inactive**: Allowing all content
- **Status Indicator**: Green (active) or amber (inactive) with pulsing animation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Extension not loading:**
- Ensure you built the project (`npm run build`)
- Check that Developer mode is enabled in Chrome
- Verify the `build/` folder contains compiled files

**Python server errors:**
- Activate the virtual environment first
- Install all requirements: `pip install -r requirements.txt`
- Check that port 5000 is available

**Predictions not working:**
- Ensure the Flask server is running on port 5000
- Check browser console for CORS errors
- Verify Supabase credentials are correct

**Model accuracy is low:**
- Provide more feedback through the extension
- Retrain the model with `/admin/retrain-model`
- Ensure balanced training data (productive vs unproductive)

### Getting Help

- 📧 Email: support@studyrat.com
- 🌐 Website: [StudyRat.com](https://studyrat.com)
- 🐛 Issues: [GitHub Issues](https://github.com/studyrat/sage-ai-extension/issues)

## 🙏 Acknowledgments

- Built with ❤️ for students everywhere
- Powered by scikit-learn and Flask
- UI inspired by modern design principles
- Thanks to the open-source community

---

**Made with 🧠 by [StudyRat.com](https://studyrat.com)**