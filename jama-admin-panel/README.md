# Jama Translation Admin Panel

A professional admin panel for monitoring and controlling the Jama real-time Arabic-to-Dutch translation system.

## Features

- **Real-time Monitoring**: Live display of Arabic transcription and Dutch translation
- **Professional UI**: Clean, modern interface with dark theme support
- **Connection Status**: Real-time connection monitoring to the translation backend
- **Session Control**: Start/Stop translation sessions (UI ready, backend integration needed)
- **Visual Feedback**: Animated indicators when new translations arrive
- **RTL Support**: Proper right-to-left text display for Arabic transcription

## Quick Start

### Prerequisites
- Node.js installed
- Your existing Jama translation system running on port 8765

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

## How It Works

The admin panel connects directly to your existing Jama WebSocket server on port 8765 and displays real-time transcription and translation data. 

### Data Flow
1. **Arabic Speech** → Speechmatics STT → Your existing backend
2. **Your Backend** → OpenAI Translation → WebSocket Broadcast (port 8765)
3. **Admin Panel** → Receives broadcasts → Real-time display

### Connection Requirements
- WebSocket server running on `ws://localhost:8765`
- Your existing `websocket-server.py` must be running
- Your LiveKit backend must be broadcasting to the WebSocket server

## Interface Overview

### Status Dashboard
- **Connection Status**: Shows if connected to the WebSocket server
- **Session Status**: Displays current session state
- **Last Update**: Timestamp of the most recent translation

### Live Translation Display
- **Left Panel**: Arabic transcription with RTL text support
- **Right Panel**: Dutch translation
- **Visual Indicators**: Green pulsing dots when new data arrives
- **Timestamps**: Show when each translation was received

### Session Controls
- **Start Session**: Begin translation monitoring (currently UI-only)
- **Stop Session**: End the current session
- **Refresh**: Reload the interface

## Technical Details

### Built With
- **React** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **WebSocket** for real-time communication

### WebSocket Message Format
The admin panel expects messages in this format:
```json
{
  "type": "transcription" | "translation",
  "language": "ar" | "nl", 
  "text": "The actual text content",
  "timestamp": 1234567890,
  "source": "livekit"
}
```

## Integration with Existing System

This admin panel is designed to work seamlessly with your existing Jama translation system:

- ✅ **No changes required** to your LiveKit backend
- ✅ **No changes required** to your translation logic  
- ✅ **No changes required** to your WebSocket server
- ✅ Simply connects and displays the data

## Future Enhancements

- LiveKit session management integration
- Recording controls
- Translation history logging
- Performance analytics
- Multi-language support
- Export functionality

## Support

This admin panel is designed to complement your existing Jama translation system. It provides a professional interface for monitoring real-time translations without disrupting your working setup.
