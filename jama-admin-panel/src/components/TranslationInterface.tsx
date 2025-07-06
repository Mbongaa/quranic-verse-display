
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import ConnectionStatus from './ConnectionStatus';
import TranscriptionDisplay from './TranscriptionDisplay';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { Play, Square, RefreshCw } from 'lucide-react';

export default function TranslationInterface() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const { toast } = useToast();
  
  // Connect to the existing Jama WebSocket server
  const { data, isConnected } = useWebSocket('ws://localhost:8765');

  const handleStartSession = async () => {
    // In a real implementation, this would trigger your LiveKit backend
    // For now, it just shows that a session is active
    setIsSessionActive(true);
    toast({
      title: "Session Started",
      description: "Jama Translation session is now active",
    });
  };

  const handleStopSession = async () => {
    setIsSessionActive(false);
    toast({
      title: "Session Stopped",
      description: "Jama Translation session has been stopped",
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

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-700">Session Controls</h2>
                <div className="flex gap-2">
                  {!isSessionActive ? (
                    <Button
                      onClick={handleStartSession}
                      disabled={!isConnected}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Translation Session
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStopSession}
                      variant="destructive"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop Session
                    </Button>
                  )}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Connection Status</p>
                  <p className="text-lg font-bold text-blue-800">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-emerald-600 font-medium">Session Status</p>
                  <p className="text-lg font-bold text-emerald-800">
                    {isSessionActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Last Update</p>
                  <p className="text-lg font-bold text-purple-800">
                    {data.lastUpdate ? new Date(data.lastUpdate).toLocaleTimeString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <TranscriptionDisplay
          arabicTranscription={data.arabicTranscription}
          dutchTranslation={data.dutchTranslation}
          lastUpdate={data.lastUpdate}
        />

        <div className="text-center text-sm text-gray-500">
          <p>Built with React & Tailwind CSS • Connected to Jama Translation Backend</p>
        </div>
      </div>
    </div>
  );
}
