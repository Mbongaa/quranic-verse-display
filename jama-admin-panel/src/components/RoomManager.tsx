import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Play, Square, Users, Clock, Trash2, RefreshCw } from 'lucide-react';

interface Room {
  name: string;
  sid: string;
  numParticipants: number;
  creationTime: number;
  metadata?: string;
}

interface Session {
  roomName: string;
  hostName: string;
  startTime: string;
  isActive: boolean;
}

interface RoomManagerProps {
  onRoomCreated: (roomName: string, hostName: string) => void; // Remove targetLanguage parameter
}

const API_BASE = 'http://localhost:3001/api';

// Available target languages (for future use)
const TRANSLATION_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
];

export default function RoomManager({ onRoomCreated }: RoomManagerProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [hostName, setHostName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('nl'); // Default to Dutch
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch rooms and sessions
  const fetchData = async () => {
    try {
      const [roomsRes, sessionsRes] = await Promise.all([
        fetch(`${API_BASE}/rooms`),
        fetch(`${API_BASE}/sessions`)
      ]);

      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(roomsData);
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Start live hosting session
  const startLiveSession = async () => {
    if (!newRoomName.trim() || !hostName.trim()) {
      toast({
        title: "Error",
        description: "Please enter both room name and host name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create the room first (this ensures the LiveKit agent connects)
      const response = await fetch(`${API_BASE}/rooms/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: newRoomName.trim(),
          // Remove targetLanguage parameter to revert to working version
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create room: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🚀 Room creation result:', result);

      // Call the callback with room details (remove targetLanguage)
      onRoomCreated(newRoomName.trim(), hostName.trim());

      // Reset form
      setNewRoomName('');
      setHostName('');
      setSelectedLanguage('nl'); // Reset language picker but don't pass to backend

      toast({
        title: "Success! 🎉",
        description: `Room "${newRoomName}" created successfully!`,
      });

    } catch (error) {
      console.error('❌ Error creating room:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create room",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Stop a translation session (kept for backward compatibility)
  const stopSession = async (roomName: string) => {
    try {
      const response = await fetch(`${API_BASE}/sessions/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomName }),
      });

      if (response.ok) {
        toast({
          title: "Session Stopped",
          description: `Translation session "${roomName}" stopped successfully`,
        });
        fetchData();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to stop session');
      }
    } catch (error) {
      console.error('Error stopping session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to stop session",
        variant: "destructive",
      });
    }
  };

  // Generate room join URL (for external participants)
  const getRoomUrl = (roomName: string) => {
    return `http://localhost:3000/parties/${roomName}`;
  };

  // Copy URL to clipboard
  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL Copied",
      description: "Room URL copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      {/* Create New Live Session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Start Live Translation Session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="roomName">Room Name</Label>
              <Input
                id="roomName"
                placeholder="e.g., friday-khutba-dec2024"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="hostName">Your Name</Label>
              <Input
                id="hostName"
                placeholder="e.g., Imam Ahmed"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
              />
            </div>
          </div>
          
          {/* Language Selection (Now Functional!) */}
          <div>
            <Label htmlFor="translationLanguage">Translation Language</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger id="translationLanguage">
                <SelectValue placeholder="Select target language..." />
              </SelectTrigger>
              <SelectContent>
                {TRANSLATION_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Arabic speech will be translated to this language
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-700 text-sm">
              <strong>How it works:</strong> Creating a room will automatically start the live session and switch to Live Monitor tab where you can control your microphone and see real-time transcriptions.
            </p>
          </div>
          <Button 
            onClick={startLiveSession} 
            disabled={loading || !newRoomName.trim() || !hostName.trim()}
            className="w-full"
          >
            {loading ? 'Creating Room...' : 'Create Room & Start Hosting'}
          </Button>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Active Sessions ({sessions.length})
            </span>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No active sessions</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.roomName} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{session.roomName}</h3>
                      <Badge variant="outline" className="text-green-600">
                        Active
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Host: {session.hostName} • Started: {new Date(session.startTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyUrl(getRoomUrl(session.roomName))}
                    >
                      Copy URL
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => stopSession(session.roomName)}
                    >
                      <Square className="w-4 h-4 mr-1" />
                      Stop
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Rooms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            All Rooms ({rooms.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No rooms found</p>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => {
                const isActive = sessions.some(s => s.roomName === room.name);
                return (
                  <div key={room.sid} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{room.name}</h3>
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {room.numParticipants} participants
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Created: {new Date(room.creationTime).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyUrl(getRoomUrl(room.name))}
                      >
                        Copy URL
                      </Button>
                      {isActive && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => stopSession(room.name)}
                        >
                          <Square className="w-4 h-4 mr-1" />
                          Stop
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 