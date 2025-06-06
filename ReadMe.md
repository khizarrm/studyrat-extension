# SAGE AI

A Chrome extension that blocks unproductive content on webpages using AI-powered content analysis.

**Made by Study Rat**

## Prerequisites

- Python 3.7 or higher
- Chrome browser

## Installation

### 1. Python Setup
1. Download the SAGE AI extension files
2. Open terminal/command prompt and navigate to the project folder
3. Create a virtual environment (recommended):
   ```bash
   python -m venv sage_env
   ```
4. Activate the virtual environment:
   - **Windows**: 
     ```bash
     sage_env\Scripts\activate
     ```
   - **Mac/Linux**: 
     ```bash
     source sage_env/bin/activate
     ```
5. Install the required Python modules:
   ```bash
   pip install -r requirements.txt
   ```
6. Start the server:
   ```bash
   python app.py
   ```

**Note**: Keep this terminal window open and the server running while using the extension.

### 2. Load Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right
3. Click "Load unpacked"
4. Select the SAGE AI extension folder
5. The extension should now appear in your extensions list

## Usage

The extension should now be active! Visit any potentially distracting website to see SAGE AI in action.

## Modes

SAGE AI operates in two modes:

### Blocking Mode (Default)
- Unproductive content is automatically blocked with an overlay
- Helps maintain focus by preventing access to distracting content

### Learning Mode
- A prediction card appears in the top-left corner of webpages
- Shows AI's prediction of whether the page is productive or not
- Allows you to provide feedback to improve the model
- Feedback is automatically saved to the database for future training

## Admin Access

### Accessing Admin Panel
1. Click the SAGE AI logo in the extension popup **5 times**
2. Enter the admin password when prompted
3. Access granted to admin features

### Admin Features
- **Mode Toggle**: Switch between Learning and Blocking modes
- **Model Retraining**: 
  - Checks for new feedback data that hasn't been used for training
  - Click "Retrain Model" to update the AI with latest user feedback
  - Improves accuracy based on real user interactions

## How It Works

1. **Content Analysis**: AI analyzes webpage content in real-time
2. **Learning**: User feedback continuously improves model accuracy
3. **Blocking**: Productive/unproductive classification determines content access
4. **Adaptation**: Model retraining ensures the system learns from user behavior

---

*Stay focused, stay productive with SAGE AI!*