import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Trash2, Download, FileText, Languages } from 'lucide-react';

interface SimpleHostProps {
  roomName: string;
  userName: string;
  onExit: () => void;
}

export default function SimpleHost({ roomName, userName, onExit }: SimpleHostProps) {
  const [isHosting, setIsHosting] = useState(false);
  const { data: translationData, isConnected: wsConnected, clearHistory, getSessionStats, performMemoryCleanup } = useWebSocket('ws://localhost:8765');
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  // LiveKit frontend URL with auto-join parameters
  const livekitUrl = `http://localhost:3000/parties/${roomName}?name=${encodeURIComponent(userName)}&host=true&autoJoin=true`;

  useEffect(() => {
    // Mark as hosting when component mounts
    setIsHosting(true);
    
    return () => {
      setIsHosting(false);
    };
  }, []);

  // Auto-scroll to bottom when new translations arrive
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [translationData.completedTranslations, translationData.currentArabicTranscription]);

  const exportTranscript = () => {
    const transcript = translationData.completedTranslations.map((entry, index) => 
      `${index + 1}. [${new Date(entry.timestamp).toLocaleTimeString()}]\nArabic: ${entry.arabicText}\nDutch: ${entry.translatedText}\n`
    ).join('\n');

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${roomName}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportArabicOnly = () => {
    const transcript = translationData.completedTranslations.map((entry, index) => 
      `${index + 1}. [${new Date(entry.timestamp).toLocaleTimeString()}] ${entry.arabicText}`
    ).join('\n');

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arabic-transcript-${roomName}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportDutchOnly = () => {
    const transcript = translationData.completedTranslations.map((entry, index) => 
      `${index + 1}. [${new Date(entry.timestamp).toLocaleTimeString()}] ${entry.translatedText}`
    ).join('\n');

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dutch-transcript-${roomName}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">Live Session</h2>
          <Badge variant={isHosting ? "default" : "secondary"}>
            {isHosting ? "Hosting" : "Stopped"}
          </Badge>
          {wsConnected && (
            <Badge variant="outline" className="text-green-600">
              Display Stream Connected
            </Badge>
          )}
          <Badge variant="outline" className="text-blue-600">
            {translationData.completedTranslations.length} translations
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Host: {userName}</span>
          <Button variant="destructive" onClick={onExit}>
            Exit Room
          </Button>
        </div>
      </div>

      {/* LiveKit Hosting Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Audio Hosting Interface</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-96 border rounded-lg overflow-hidden">
            <iframe
              src={livekitUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              allow="microphone; camera"
              title="LiveKit Host Interface"
              className="w-full h-full"
              style={{ overflow: 'hidden' }}
              scrolling="no"
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Use the interface above to control your microphone and audio settings.
          </p>
        </CardContent>
      </Card>

      {/* Session Transcript */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Session Transcript</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportTranscript}
              disabled={translationData.completedTranslations.length === 0}
              title="Export full transcript (Arabic + Dutch)"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Full
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportArabicOnly}
              disabled={translationData.completedTranslations.length === 0}
              title="Export Arabic transcription only"
            >
              <FileText className="w-4 h-4 mr-2" />
              Arabic Only
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportDutchOnly}
              disabled={translationData.completedTranslations.length === 0}
              title="Export Dutch translation only"
            >
              <Languages className="w-4 h-4 mr-2" />
              Dutch Only
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearHistory}
              disabled={translationData.completedTranslations.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            ref={transcriptScrollRef}
            className="h-80 overflow-y-auto border rounded-lg p-4 space-y-4 bg-gray-50 scroll-smooth"
          >
            {translationData.completedTranslations.length === 0 && !translationData.currentArabicTranscription ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Waiting for speech to begin...</p>
                <p className="text-sm text-gray-400 mt-1">Start speaking into the microphone above</p>
              </div>
            ) : (
              <>
                {/* Completed Translation Pairs */}
                {translationData.completedTranslations.map((entry, index) => (
                  <div key={entry.id} className="bg-white rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">
                        #{index + 1} • {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-right">
                        <span className="text-sm text-gray-600">Arabic:</span>
                        <p className="text-base font-medium text-blue-700" dir="rtl" style={{ textAlign: 'right', direction: 'rtl' }}>
                          {entry.arabicText}
                        </p>
                      </div>
                      <div className="text-left">
                        <span className="text-sm text-gray-600">Dutch:</span>
                        <p className="text-base font-medium text-green-700" style={{ textAlign: 'left', direction: 'ltr' }}>
                          {entry.translatedText}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Current In-Progress Transcription */}
                {translationData.currentArabicTranscription && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-yellow-700 font-medium">
                        ⏳ Transcribing... • {new Date(translationData.lastUpdate).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-600">Arabic:</span>
                      <p className="text-base font-medium text-blue-700" dir="rtl" style={{ textAlign: 'right', direction: 'rtl' }}>
                        {translationData.currentArabicTranscription}
                      </p>
                    </div>
                    <div className="text-left">
                      <span className="text-sm text-gray-600">Dutch:</span>
                      <p className="text-sm text-gray-500 italic" style={{ textAlign: 'left', direction: 'ltr' }}>
                        Translation in progress...
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Live Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1">
            <div>Room: <span className="font-mono">{roomName}</span></div>
            <div>Status: <span className={isHosting ? "text-green-600" : "text-red-600"}>{isHosting ? "Hosting Active" : "Stopped"}</span></div>
            <div>WebSocket: <span className={wsConnected ? "text-green-600" : "text-red-600"}>{wsConnected ? "Connected" : "Disconnected"}</span></div>
            <div>Completed Pairs: <span className="text-blue-600">{translationData.completedTranslations.length}</span></div>
            <div>Current Transcription: <span className={translationData.currentArabicTranscription ? "text-yellow-600" : "text-gray-500"}>{translationData.currentArabicTranscription ? "In Progress" : "None"}</span></div>
            {translationData.lastUpdate > 0 && (
              <div>Last Update: <span className="text-gray-600">{new Date(translationData.lastUpdate).toLocaleTimeString()}</span></div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session Statistics & Health Monitoring */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Session Health Monitor</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={performMemoryCleanup}
            title="Manually trigger memory cleanup"
          >
            🧹 Cleanup Memory
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="font-semibold text-gray-700">Performance</div>
              <div>Session Duration: <span className="font-mono">{getSessionStats().duration} min</span></div>
              <div>Total Processed: <span className="font-mono">{getSessionStats().totalProcessed}</span></div>
              <div>Rate: <span className="font-mono">{getSessionStats().averagePerMinute.toFixed(1)}/min</span></div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-gray-700">Memory Usage</div>
              <div>In Memory: <span className="font-mono">{getSessionStats().inMemory} entries</span></div>
              <div>Memory Health: <span className={
                getSessionStats().inMemory < 80 ? "text-green-600" : 
                getSessionStats().inMemory < 95 ? "text-yellow-600" : "text-red-600"
              }>
                {getSessionStats().inMemory < 80 ? "Good" : 
                 getSessionStats().inMemory < 95 ? "Moderate" : "High"}
              </span></div>
              <div>Auto-cleanup: <span className="text-blue-600">Every 5 min</span></div>
            </div>
          </div>
          
          {/* Health alerts */}
          {getSessionStats().duration > 45 && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              ⚠️ Long session detected ({getSessionStats().duration} min). Consider taking a break or restarting if issues occur.
            </div>
          )}
          
          {getSessionStats().inMemory > 90 && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              🚨 High memory usage. Consider clearing history or restarting the session.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 