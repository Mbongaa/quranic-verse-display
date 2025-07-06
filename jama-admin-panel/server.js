import express from 'express';
import cors from 'cors';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables with explicit path
dotenv.config({ path: path.join(__dirname, '.env') });

// Debug: Check if environment variables are loaded
console.log('🔍 Environment check:');
console.log('Current directory:', __dirname);
console.log('API Key:', process.env.LIVEKIT_API_KEY ? `${process.env.LIVEKIT_API_KEY.substring(0, 8)}...` : 'MISSING');
console.log('API Secret:', process.env.LIVEKIT_API_SECRET ? 'Found' : 'MISSING');
console.log('LiveKit URL:', process.env.NEXT_PUBLIC_LIVEKIT_URL || 'MISSING');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// LiveKit configuration
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

if (!apiKey || !apiSecret || !livekitUrl) {
  console.error('❌ Missing LiveKit environment variables');
  console.error('Please set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and NEXT_PUBLIC_LIVEKIT_URL in .env');
  process.exit(1);
}

const roomService = new RoomServiceClient(livekitUrl.replace('wss://', 'https://'));

// Store active sessions
const activeSessions = new Map();

// Generate LiveKit token
const createToken = (userInfo, grant) => {
  const at = new AccessToken(apiKey, apiSecret, userInfo);
  at.addGrant(grant);
  return at.toJwt();
};

// Routes
app.get('/api/token', async (req, res) => {
  try {
    const { party_id, name, host } = req.query;
    
    if (!party_id || !name) {
      return res.status(400).json({ error: 'party_id and name are required' });
    }

    const roomName = party_id;
    const identity = name;
    const isHost = host === 'true';

    const grant = {
      room: roomName,
      roomJoin: true,
      canPublish: isHost,
      canPublishData: true,
      canSubscribe: true,
      canUpdateOwnMetadata: true,
    };

    const token = createToken({ identity }, grant);

    res.json({
      identity,
      token,
      serverUrl: livekitUrl,
    });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST token endpoint for LiveHost component
app.post('/api/token', async (req, res) => {
  try {
    const { roomName, participantName, isHost } = req.body;
    
    if (!roomName || !participantName) {
      return res.status(400).json({ error: 'roomName and participantName are required' });
    }

    const identity = participantName;

    const grant = {
      room: roomName,
      roomJoin: true,
      canPublish: isHost || false,
      canPublishData: true,
      canSubscribe: true,
      canUpdateOwnMetadata: true,
    };

    const token = createToken({ identity }, grant);

    res.json({
      identity,
      token,
      serverUrl: livekitUrl,
    });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create room endpoint
app.post('/api/rooms/create', async (req, res) => {
  try {
    const { roomName } = req.body; // Remove targetLanguage to revert to original
    
    if (!roomName) {
      return res.status(400).json({ error: 'roomName is required' });
    }

    console.log(`🚀 Creating room "${roomName}"`); // Remove target language logging

    // Create room
    try {
      const room = await roomService.createRoom({
        name: roomName,
        maxParticipants: 100,
        emptyTimeout: 10 * 60, // 10 minutes
        metadata: JSON.stringify({
          createdAt: new Date().toISOString(),
          createdBy: 'admin-panel'
          // Remove targetLanguage metadata
        })
      });

      console.log(`✅ Room "${roomName}" created successfully`); // Remove target language logging

      res.json({
        success: true,
        roomName: roomName,
        message: 'Room created successfully'
      });
    } catch (createError) {
      console.error(`❌ Failed to create room "${roomName}":`, createError);
      
      // Check if room already exists
      try {
        const existingRoom = await roomService.getRoom(roomName);
        if (existingRoom) {
          console.log(`ℹ️ Room "${roomName}" already exists, returning success`);
          res.json({
            success: true,
            roomName: roomName,
            message: 'Room already exists'
          });
          return;
        }
      } catch (getError) {
        // Room doesn't exist, continue with error handling
      }
      
      res.status(500).json({ 
        error: 'Failed to create room',
        details: createError.message 
      });
    }
  } catch (error) {
    console.error('❌ Room creation error:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
  }
});

// Get active rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await roomService.listRooms();
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create room and start translation session
app.post('/api/sessions/start', async (req, res) => {
  try {
    const { roomName, hostName } = req.body;
    
    if (!roomName || !hostName) {
      return res.status(400).json({ error: 'roomName and hostName are required' });
    }

    // Create room if it doesn't exist
    try {
      await roomService.createRoom({
        name: roomName,
        maxParticipants: 100,
        emptyTimeout: 10 * 60, // 10 minutes
        metadata: JSON.stringify({
          createdBy: hostName,
          createdAt: new Date().toISOString(),
        }),
      });
    } catch (error) {
      // Room might already exist, that's okay
      console.log('Room creation result:', error.message);
    }

    // Note: LiveKit agent should already be running with 'python main.py dev'
    // We don't need to start a new agent process for each room
    console.log(`💡 Room "${roomName}" created. LiveKit agent (running separately) will handle it automatically.`);

    // Store the session (without process reference since agent runs separately)
    activeSessions.set(roomName, {
      roomName,
      hostName,
      startTime: new Date().toISOString(),
    });

    res.json({
      message: 'Session started successfully',
      roomName,
      hostName,
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stop translation session
app.post('/api/sessions/stop', async (req, res) => {
  try {
    const { roomName } = req.body;
    
    if (!roomName) {
      return res.status(400).json({ error: 'roomName is required' });
    }

    const session = activeSessions.get(roomName);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Remove session (LiveKit agent continues running separately)
    activeSessions.delete(roomName);
    console.log(`🛑 Session "${roomName}" removed from admin panel. LiveKit agent continues running.`);

    res.json({ message: 'Session stopped successfully' });
  } catch (error) {
    console.error('Error stopping session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get active sessions
app.get('/api/sessions', (req, res) => {
  const sessions = Array.from(activeSessions.values()).map(session => ({
    roomName: session.roomName,
    hostName: session.hostName,
    startTime: session.startTime,
  }));
  res.json(sessions);
});

// Get session status
app.get('/api/sessions/:roomName', (req, res) => {
  const { roomName } = req.params;
  const session = activeSessions.get(roomName);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    roomName: session.roomName,
    hostName: session.hostName,
    startTime: session.startTime,
    isActive: true,
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeSessions: activeSessions.size,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Admin Panel Backend running on port ${PORT}`);
  console.log(`📡 LiveKit URL: ${livekitUrl}`);
  console.log(`🔑 API Key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'Not set'}`);
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('🛑 Shutting down admin panel gracefully...');
  console.log(`📊 Had ${activeSessions.size} active sessions in admin panel`);
  console.log('💡 LiveKit agent continues running separately');
  process.exit(0);
}); 