
import React, { useEffect, useState } from 'react';
import { Volume2, Mic } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TranscriptionDisplayProps {
  arabicTranscription: string;
  dutchTranslation: string;
  lastUpdate: number;
}

export default function TranscriptionDisplay({
  arabicTranscription,
  dutchTranslation,
  lastUpdate
}: TranscriptionDisplayProps) {
  const [isRecentlyUpdated, setIsRecentlyUpdated] = useState(false);

  useEffect(() => {
    if (lastUpdate) {
      setIsRecentlyUpdated(true);
      const timer = setTimeout(() => setIsRecentlyUpdated(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  const formatTime = (timestamp: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString();
  };

  const isRecentUpdate = (timestamp: number) => {
    return Date.now() - timestamp < 5000; // Within last 5 seconds
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className={`transition-all duration-300 ${isRecentlyUpdated ? 'ring-2 ring-blue-300' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Arabic Transcription
            {lastUpdate && (
              <div className="flex items-center ml-auto gap-2">
                {isRecentUpdate(lastUpdate) && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
                <span className="text-xs text-gray-500">
                  {formatTime(lastUpdate)}
                </span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="min-h-64 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg border">
            <div 
              className="text-lg leading-relaxed text-right"
              dir="rtl"
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              {arabicTranscription || (
                <span className="text-gray-400 italic">
                  Waiting for Arabic transcription...
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`transition-all duration-300 ${isRecentlyUpdated ? 'ring-2 ring-emerald-300' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Dutch Translation
            {lastUpdate && (
              <div className="flex items-center ml-auto gap-2">
                {isRecentUpdate(lastUpdate) && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
                <span className="text-xs text-gray-500">
                  {formatTime(lastUpdate)}
                </span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="min-h-64 max-h-96 overflow-y-auto p-4 bg-emerald-50 rounded-lg border">
            <div className="text-lg leading-relaxed">
              {dutchTranslation || (
                <span className="text-gray-400 italic">
                  Waiting for Dutch translation...
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
