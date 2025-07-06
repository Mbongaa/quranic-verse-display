
# Jamaa Frontend Integration Guide

## Overview
This React frontend replaces your Gradio interface with a modern, mobile-first web application for real-time khutba translation.

## Frontend Features
- ✅ Real-time English transcription display
- ✅ Real-time Dutch translation display
- ✅ Mobile-first responsive design
- ✅ Language selection dropdown
- ✅ Custom translation prompt editing
- ✅ WebSocket connection for live updates
- ✅ Recording start/stop controls
- ✅ Connection status indicator
- ✅ Beautiful mosque-friendly UI with Islamic green theme

## Backend Integration Options

### Option 1: Modify Your Existing app.py

Add these endpoints to your existing `app.py`:

```python
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)

def broadcast_state():
    """Add this function to broadcast updates"""
    data = {
        'transcript': transcript,
        'partial_transcript': partial_transcript,
        'dutch_translation': dutch_translation.replace('\n', '<br/>'),
        'is_recording': is_recording  # Add this global variable
    }
    socketio.emit('translation_update', data)

# Modify your existing update functions to call broadcast_state()
def update_transcript(msg):
    global transcript, transcript_segments
    current_transcript = msg["metadata"]["transcript"].strip()
    if len(current_transcript) > 0:
        transcript += current_transcript + " "
        transcript_segments.append(current_transcript)
        broadcast_state()  # Add this line

def update_partial(msg):
    global partial_transcript
    partial_transcript = msg["metadata"]["transcript"].strip()
    broadcast_state()  # Add this line

# Add these new endpoints:

@app.route('/start_recording', methods=['POST'])
def start_recording():
    # Your recording logic here
    is_recording = True
    broadcast_state()
    return jsonify({'status': 'started'})

@app.route('/stop_recording', methods=['POST']) 
def stop_recording():
    is_recording = False
    broadcast_state()
    return jsonify({'status': 'stopped'})

@app.route('/clear', methods=['POST'])
def clear_responses():
    # Your existing clear_responses() logic
    broadcast_state()
    return jsonify({'status': 'cleared'})

@socketio.on('connect')
def handle_connect():
    emit('translation_update', {
        'transcript': transcript,
        'partial_transcript': partial_transcript,  
        'dutch_translation': dutch_translation.replace('\n', '<br/>'),
        'is_recording': is_recording
    })

if __name__ == "__main__":
    socketio.run(app, host='0.0.0.0', port=8000)
```

### Option 2: Use the Provided Flask Backend

Use the `backend_example.py` file provided, which includes:
- WebSocket support for real-time updates
- REST API endpoints for all frontend actions
- CORS enabled for cross-origin requests
- All your existing transcription and translation logic

## Setup Instructions

### 1. Install Dependencies

Backend:
```bash
pip install flask flask-socketio flask-cors
```

Frontend is already set up with all required dependencies.

### 2. Environment Variables

Make sure these are set in your environment:
```bash
export OPENAI_API_KEY="your_openai_api_key"
export SM_API_KEY="your_speechmatics_api_key"
```

### 3. Run the Application

1. Start your backend:
```bash
python app.py  # or python backend_example.py
```

2. The frontend is already running in this Lovable environment

3. Update the backend URL in the frontend if needed (default: `ws://localhost:8000`)

## API Endpoints

- `POST /start_recording` - Start transcription
- `POST /stop_recording` - Stop transcription  
- `POST /clear` - Clear all transcripts
- `POST /update_prompt` - Update translation prompt
- `GET /status` - Get current status
- `WebSocket /ws` - Real-time updates

## Customization

### Styling
The app uses a mosque-friendly Islamic green theme. You can customize colors in the Tailwind classes:
- `bg-emerald-50` - Light background
- `text-emerald-800` - Header text
- `bg-emerald-500` - Primary buttons

### Languages
Add more languages by updating the `LANGUAGES` array in `TranslationInterface.tsx`

### Translation Prompts
Users can customize translation prompts through the settings panel, or you can modify the `DEFAULT_PROMPT` constant.

## Mobile Optimization

The interface is fully responsive and optimized for mobile use in mosques:
- Large, readable text
- Touch-friendly buttons
- Responsive grid layout
- Optimized for portrait orientation

## Deployment

For production deployment:
1. Build the React app: `npm run build`
2. Serve the build files with a web server
3. Update WebSocket URLs to use `wss://` for HTTPS
4. Set up proper SSL certificates

## Troubleshooting

1. **WebSocket connection issues**: Check that your backend is running on the correct port and that CORS is properly configured.

2. **Translation not updating**: Ensure your OpenAI API key is valid and the translation prompt contains `{text}` placeholder.

3. **Audio not working**: Check that your microphone permissions are granted and the audio processing pipeline is properly set up.

This frontend provides a much better user experience than Gradio while maintaining all the functionality of your existing backend!
