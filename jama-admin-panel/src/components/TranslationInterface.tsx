
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import ConnectionStatus from './ConnectionStatus';
import TranscriptionDisplay from './TranscriptionDisplay';
import RoomManager from './RoomManager';
import SimpleHost from './SimpleHost';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Square, RefreshCw, Settings, Monitor } from 'lucide-react';

interface LiveSession {
  roomName: string;
  userName: string;
  // Remove targetLanguage to revert to working version
  startTime: number;
}

export default function TranslationInterface() {
  const [activeTab, setActiveTab] = useState<string>('room-manager');
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const { toast } = useToast();
  
  // Connect to the existing Jama WebSocket server for fallback monitoring
  const { data, isConnected } = useWebSocket('ws://localhost:8765');

  // Start live hosting session
  const handleRoomCreated = (roomName: string, userName: string) => { // Remove targetLanguage parameter
    console.log(`🚀 Room created: ${roomName} for ${userName}`); // Remove targetLanguage logging
    
    setLiveSession({
      roomName,
      userName,
      // Remove targetLanguage to revert to working version
      startTime: Date.now(),
    });
    
    // Auto-switch to Live Monitor tab
    setActiveTab('live-monitor');
  };

  // Exit live session
  const handleExitLiveSession = () => {
    console.log('🔚 Exiting live session');
    
    setLiveSession(null);
    setActiveTab('room-manager'); // Return to room management

    toast({
      title: "Live Session Ended",
      description: "Returned to room management",
    });
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-emerald-800">Jama</h1>
          <p className="text-emerald-600 text-lg">Real-time Khutba Translation - Admin Panel</p>
          <ConnectionStatus isConnected={isConnected} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="room-manager" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Room Management
            </TabsTrigger>
            <TabsTrigger 
              value="live-monitor" 
              className="flex items-center gap-2"
              disabled={!liveSession?.startTime}
            >
              <Monitor className="w-4 h-4" />
              Live Monitor
              {liveSession?.startTime && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  LIVE
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="room-manager" className="space-y-6">
            <RoomManager onRoomCreated={handleRoomCreated} />
          </TabsContent>

          <TabsContent value="live-monitor" className="space-y-6">
            {liveSession?.startTime ? (
              <SimpleHost
                roomName={liveSession.roomName}
                userName={liveSession.userName}
                onExit={handleExitLiveSession}
              />
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-700">Live Translation Monitor</h2>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleRefresh}
                          variant="outline"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="text-center py-8">
                      <Monitor className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">No Active Live Session</h3>
                      <p className="text-gray-500 mb-4">
                        Create a room in Room Management to start a live translation session
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab('room-manager')}
                      >
                        Go to Room Management
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-gray-500">
          <p>Built with React & Tailwind CSS • Connected to Jama Translation Backend</p>
        </div>
      </div>
    </div>
  );
}
