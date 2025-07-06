
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface JamaTranslationData {
  arabicTranscription: string;
  dutchTranslation: string;
  isConnected: boolean;
  lastUpdate: number;
}

export function useWebSocket(backendUrl: string) {
  const [data, setData] = useState<JamaTranslationData>({
    arabicTranscription: '',
    dutchTranslation: '',
    isConnected: false,
    lastUpdate: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        // Connect directly to the existing Jama WebSocket server on port 8765
        const ws = new WebSocket('ws://localhost:8765');
        
        ws.onopen = () => {
          console.log('Connected to Jama Translation WebSocket');
          setIsConnected(true);
          setData(prev => ({ ...prev, isConnected: true }));
          toast({
            title: "Connected",
            description: "Successfully connected to Jama Translation System",
          });
        };

        ws.onmessage = (event) => {
          try {
            const receivedData = JSON.parse(event.data);
            console.log('Received from Jama system:', receivedData);
            
            // Handle the broadcast data from your existing system
            if (receivedData.type === 'transcription' && receivedData.language === 'ar') {
              // Arabic transcription
              setData(prev => ({
                ...prev,
                arabicTranscription: receivedData.text,
                lastUpdate: Date.now()
              }));
            } else if (receivedData.type === 'translation' && receivedData.language === 'nl') {
              // Dutch translation
              setData(prev => ({
                ...prev,
                dutchTranslation: receivedData.text,
                lastUpdate: Date.now()
              }));
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('Jama WebSocket connection closed');
          setIsConnected(false);
          setData(prev => ({ ...prev, isConnected: false }));
          // Auto-reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error('Jama WebSocket error:', error);
          setIsConnected(false);
          setData(prev => ({ ...prev, isConnected: false }));
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to connect to Jama WebSocket:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to Jama Translation System on port 8765",
          variant: "destructive",
        });
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [backendUrl, toast]);

  return { data, setData, isConnected };
}
