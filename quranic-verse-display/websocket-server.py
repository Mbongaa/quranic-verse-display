#!/usr/bin/env python3
"""
Standalone WebSocket server for quranic-verse-display
Receives real transcription and translation data from LiveKit backend
"""

import asyncio
import websockets
import json
import time
import logging
from typing import Set
from aiohttp import web

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Keep track of connected display clients
connected_displays: Set = set()

async def register_display(websocket):
    """Register a new display client"""
    global connected_displays
    connected_displays.add(websocket)
    logger.info(f"✅ Display client connected. Total displays: {len(connected_displays)}")
    
    try:
        # Send a welcome message
        welcome_message = {
            "type": "connection",
            "status": "connected",
            "timestamp": time.time()
        }
        await websocket.send(json.dumps(welcome_message))
        
        # Keep connection alive and wait for close
        await websocket.wait_closed()
        
    except websockets.exceptions.ConnectionClosed:
        logger.info("Display client disconnected normally")
    except Exception as e:
        logger.error(f"Error handling display client: {e}")
    finally:
        connected_displays.discard(websocket)
        logger.info(f"❌ Display client disconnected. Total displays: {len(connected_displays)}")

async def broadcast_to_displays(message_type: str, language: str, text: str):
    """Broadcast real transcription/translation to all connected display clients"""
    global connected_displays
    
    if not connected_displays:
        logger.debug(f"No display clients connected to receive {message_type}")
        return
    
    message = {
        "type": message_type,
        "language": language,
        "text": text,
        "timestamp": time.time(),
        "source": "livekit"
    }
    
    message_json = json.dumps(message)
    logger.info(f"🎤 REAL: Broadcasting to {len(connected_displays)} displays: {message_type} ({language}): {text[:50]}...")
    
    # Send to all connected displays
    disconnected = set()
    for websocket in connected_displays.copy():
        try:
            await websocket.send(message_json)
        except websockets.exceptions.ConnectionClosed:
            disconnected.add(websocket)
        except Exception as e:
            logger.error(f"Error broadcasting to display: {e}")
            disconnected.add(websocket)
    
    # Remove disconnected clients
    connected_displays -= disconnected

async def handle_broadcast_request(request):
    """HTTP endpoint to receive real transcription data from LiveKit backend"""
    try:
        data = await request.json()
        message_type = data.get("type")
        language = data.get("language")
        text = data.get("text")
        
        if message_type and language and text:
            await broadcast_to_displays(message_type, language, text)
            return web.json_response({"status": "success"})
        else:
            return web.json_response({"status": "error", "message": "Missing required fields"}, status=400)
            
    except json.JSONDecodeError:
        return web.json_response({"status": "error", "message": "Invalid JSON"}, status=400)
    except Exception as e:
        logger.error(f"Error processing broadcast request: {e}")
        return web.json_response({"status": "error", "message": str(e)}, status=500)

async def start_servers():
    """Start both WebSocket and HTTP servers"""
    logger.info("🚀 Starting WebSocket server for display clients on port 8765...")
    logger.info("🚀 Starting HTTP server for LiveKit backend on port 8766...")
    
    # Create HTTP app
    app = web.Application()
    app.router.add_post('/broadcast', handle_broadcast_request)
    
    # Start HTTP server
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 8766)
    await site.start()
    
    # Start WebSocket server
    async with websockets.serve(register_display, "localhost", 8765):
        logger.info("✅ WebSocket server started on ws://localhost:8765")
        logger.info("✅ HTTP server started on http://localhost:8766")
        logger.info("📱 Display clients can connect to ws://localhost:8765")
        logger.info("🎤 LiveKit backend can send real data to http://localhost:8766/broadcast")
        logger.info("🎯 Ready to receive real Arabic transcriptions and translations!")
        
        try:
            # Keep the servers running
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            logger.info("Shutting down servers...")
            await runner.cleanup()

if __name__ == "__main__":
    try:
        asyncio.run(start_servers())
    except KeyboardInterrupt:
        logger.info("Servers stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}") 