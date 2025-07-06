# Jama Admin Panel Setup

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your LiveKit credentials
# You can get these from https://cloud.livekit.io/
```

### 3. Start Everything
```bash
# This starts both the backend (port 3001) and frontend (port 5173)
npm start
```

The admin panel will be available at `http://localhost:5173`

## How It Works

### Architecture
- **Admin Panel Frontend**: React app on port 5173
- **Admin Panel Backend**: Node.js server on port 3001
- **LiveKit Backend**: Existing Python server (unchanged)
- **WebSocket**: Connects to existing LiveKit WebSocket on port 8765

### Features
1. **Room Management**: Create and manage translation rooms
2. **Session Control**: Start/stop translation sessions
3. **Live Monitor**: Real-time translation display
4. **URL Generation**: Share room URLs with participants

### Usage Flow
1. Go to "Room Management" tab
2. Enter room name and host name
3. Click "Start Translation Session"
4. Copy the generated URL to share with participants
5. Use "Live Monitor" tab to see real-time translations

## Environment Variables

```env
# Required: Get from LiveKit Cloud dashboard
LIVEKIT_API_KEY=your_api_key_here
LIVEKIT_API_SECRET=your_api_secret_here
LIVEKIT_URL=wss://your-livekit-server.com

# Optional: Backend port
PORT=3001
```

## Troubleshooting

### Backend Not Starting
- Make sure you have Node.js installed
- Check that port 3001 is available
- Verify your LiveKit credentials in .env

### Frontend Not Loading
- Make sure the backend is running on port 3001
- Check browser console for errors
- Verify the LiveKit backend is running on port 8765

### Sessions Not Starting
- Ensure the LiveKit Python backend is accessible
- Check that the path to `../LiveKit-ai-translation/server/main.py` is correct
- Verify Python environment has all required packages

## Manual Commands

```bash
# Start only the backend
npm run backend

# Start only the frontend
npm run dev

# Start both (recommended)
npm run start
```

## Architecture Benefits

✅ **No Changes** to LiveKit backend - it works exactly as before
✅ **Clean Separation** - admin panel is completely separate
✅ **Easy Deployment** - just copy .env and run npm start
✅ **Scalable** - can manage multiple rooms and sessions
✅ **User Friendly** - nice UI for room management

The admin panel replaces the LiveKit frontend while keeping all the powerful backend functionality intact. 