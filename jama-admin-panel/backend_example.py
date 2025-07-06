
"""
Flask backend example for Jamaa - Real-time Khutba Translation
This replaces the Gradio interface with WebSocket and REST endpoints.
"""

import asyncio
import json
import logging
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import os
from functools import partial
import speechmatics
from openai import AsyncOpenAI

# Your existing imports and setup
from file_streaming import DelayedRealtimeStream, get_audio_stream_proc

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Setup OAI client
OPENAI_CLIENT = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Setup SM client
SM_SETTINGS = speechmatics.models.AudioSettings(
    sample_rate=48000, 
    chunk_size=1024, 
    encoding="pcm_s16le"
)
SM_WS_CLIENT = speechmatics.client.WebsocketClient(
    speechmatics.models.ConnectionSettings(
        url="wss://eu2.rt.speechmatics.com/v2",
        auth_token=os.environ.get("SM_API_KEY"),
    )
)

# Global state (same as your existing code)
transcript = ""
transcript_segments = []
partial_transcript = ""
dutch_translation = ""
translated_segment_count = 0
is_recording = False

CURRENT_PROMPT = (
    "You are an expert English-to-Dutch translator. "
    "Translate the following English text to Dutch. "
    "Only provide the Dutch translation, without any additional commentary or explanations.\n"
    "English text: {text}\n"
    "Dutch translation:"
)
SELECTED_LANGUAGE = "en"

def broadcast_state():
    """Broadcast current state to all connected clients"""
    data = {
        'transcript': transcript,
        'partial_transcript': partial_transcript,
        'dutch_translation': dutch_translation.replace('\n', '<br/>'),
        'is_recording': is_recording
    }
    socketio.emit('translation_update', data)

def update_transcript(msg):
    global transcript, transcript_segments
    current_transcript = msg["metadata"]["transcript"].strip()
    if len(current_transcript) > 0:
        transcript += current_transcript + " "
        transcript_segments.append(current_transcript)
        broadcast_state()

def update_partial(msg):
    global partial_transcript
    partial_transcript = msg["metadata"]["transcript"].strip()
    broadcast_state()

# Add event handlers (same as your existing code)
SM_WS_CLIENT.add_event_handler(
    speechmatics.models.ServerMessageType.AddTranscript, 
    event_handler=update_transcript
)
SM_WS_CLIENT.add_event_handler(
    speechmatics.models.ServerMessageType.AddPartialTranscript, 
    event_handler=update_partial
)

async def call_chat_api(prompt):
    """Same as your existing function"""
    response = await OPENAI_CLIENT.chat.completions.create(
        messages=[{"role": "user", "content": prompt}], 
        model="gpt-4-1106-preview", 
        max_tokens=300
    )
    return response.choices[0].message.content

async def get_translation(prompt_to_use):
    """Same as your existing function"""
    final_prompt = prompt_to_use.format(text=transcript)
    return await call_chat_api(final_prompt)

def update_ai_response():
    """Updated version of your existing function"""
    global transcript_segments, translated_segment_count, dutch_translation, CURRENT_PROMPT
    
    if len(transcript_segments) > translated_segment_count:
        logger.info(f"New sentence detected. Updating translation.")
        
        if CURRENT_PROMPT and "{text}" in CURRENT_PROMPT:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            new_translation = loop.run_until_complete(get_translation(CURRENT_PROMPT))
            loop.close()
            
            if new_translation:
                dutch_translation = new_translation
                broadcast_state()
        
        translated_segment_count = len(transcript_segments)

# WebSocket events
@socketio.on('connect')
def handle_connect():
    logger.info('Client connected')
    # Send current state to newly connected client
    emit('translation_update', {
        'transcript': transcript,
        'partial_transcript': partial_transcript,
        'dutch_translation': dutch_translation.replace('\n', '<br/>'),
        'is_recording': is_recording
    })

@socketio.on('disconnect')
def handle_disconnect():
    logger.info('Client disconnected')

# REST API endpoints
@app.route('/start_recording', methods=['POST'])
def start_recording():
    global is_recording, SELECTED_LANGUAGE
    
    data = request.get_json()
    if data and 'language' in data:
        SELECTED_LANGUAGE = data['language']
    
    is_recording = True
    broadcast_state()
    
    # Here you would start your audio recording/transcription
    # This is a simplified version - you'll need to adapt your existing transcription logic
    logger.info(f"Starting recording with language: {SELECTED_LANGUAGE}")
    
    return jsonify({'status': 'recording_started', 'language': SELECTED_LANGUAGE})

@app.route('/stop_recording', methods=['POST'])
def stop_recording():
    global is_recording
    is_recording = False
    broadcast_state()
    logger.info("Recording stopped")
    return jsonify({'status': 'recording_stopped'})

@app.route('/clear', methods=['POST'])
def clear_responses():
    global transcript, transcript_segments, partial_transcript, dutch_translation, translated_segment_count
    
    transcript = ""
    transcript_segments = []
    partial_transcript = ""
    dutch_translation = ""
    translated_segment_count = 0
    
    broadcast_state()
    logger.info("Responses cleared")
    return jsonify({'status': 'cleared'})

@app.route('/update_prompt', methods=['POST'])
def update_prompt():
    global CURRENT_PROMPT
    
    data = request.get_json()
    if data and 'prompt' in data:
        CURRENT_PROMPT = data['prompt']
        logger.info("Prompt updated")
        
        # Re-translate if there's existing transcript
        if transcript and transcript.strip():
            update_ai_response()
        
        return jsonify({'status': 'prompt_updated'})
    
    return jsonify({'error': 'No prompt provided'}), 400

@app.route('/status', methods=['GET'])
def get_status():
    return jsonify({
        'transcript': transcript,
        'partial_transcript': partial_transcript,
        'dutch_translation': dutch_translation.replace('\n', '<br/>'),
        'is_recording': is_recording,
        'language': SELECTED_LANGUAGE
    })

if __name__ == '__main__':
    logger.info("Starting Jamaa Flask backend...")
    socketio.run(app, host='0.0.0.0', port=8000, debug=True)
