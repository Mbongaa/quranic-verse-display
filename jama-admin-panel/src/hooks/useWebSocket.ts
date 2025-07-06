
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface TranscriptionEntry {
  id: string;
  text: string;
  timestamp: number;
  isComplete: boolean;
}

interface TranslationEntry {
  id: string;
  arabicText: string;
  translatedText: string;
  timestamp: number;
}

interface JamaTranslationData {
  // Current in-progress transcription
  currentArabicTranscription: string;
  // History of completed transcription-translation pairs (limited for memory management)
  completedTranslations: TranslationEntry[];
  // History of all Arabic transcriptions (for debugging) - limited
  arabicHistory: TranscriptionEntry[];
  isConnected: boolean;
  lastUpdate: number;
  // Stats for monitoring
  totalProcessed: number;
  sessionStartTime: number;
}

// Configuration for memory management
const MAX_STORED_TRANSLATIONS = 100; // Keep last 100 translations in memory
const MAX_ARABIC_HISTORY = 50; // Keep last 50 transcriptions
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Cleanup every 5 minutes
const OLD_ENTRY_THRESHOLD = 30 * 60 * 1000; // Remove entries older than 30 minutes

export function useWebSocket(backendUrl: string) {
  const [data, setData] = useState<JamaTranslationData>({
    currentArabicTranscription: '',
    completedTranslations: [],
    arabicHistory: [],
    isConnected: false,
    lastUpdate: 0,
    totalProcessed: 0,
    sessionStartTime: Date.now()
  });
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  const accumulatedArabicRef = useRef<string>('');  // Accumulate Arabic text across fragments
  const lastTranscriptionTimeRef = useRef<number>(0);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Memory cleanup function
  const performMemoryCleanup = () => {
    setData(prev => {
      const now = Date.now();
      
      // Remove old entries to prevent memory bloat
      const recentTranslations = prev.completedTranslations
        .filter(entry => now - entry.timestamp < OLD_ENTRY_THRESHOLD)
        .slice(-MAX_STORED_TRANSLATIONS); // Keep only last N entries
      
      const recentArabicHistory = prev.arabicHistory
        .filter(entry => now - entry.timestamp < OLD_ENTRY_THRESHOLD)
        .slice(-MAX_ARABIC_HISTORY); // Keep only last N entries
      
      const cleanedCount = (prev.completedTranslations.length - recentTranslations.length) + 
                          (prev.arabicHistory.length - recentArabicHistory.length);
      
      if (cleanedCount > 0) {
        console.log(`🧹 Memory cleanup: Removed ${cleanedCount} old entries`);
        console.log(`📊 Session stats: ${prev.totalProcessed} total processed, ${recentTranslations.length} in memory`);
      }
      
      return {
        ...prev,
        completedTranslations: recentTranslations,
        arabicHistory: recentArabicHistory
      };
    });
  };

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
              // Arabic transcription - accumulate the text
              const currentTime = Date.now();
              
              // If there's a significant gap (>5 seconds), start a new sentence
              if (currentTime - lastTranscriptionTimeRef.current > 5000) {
                accumulatedArabicRef.current = '';
              }
              
              // Extract the actual Arabic text (remove trailing dots/ellipsis)
              const arabicText = receivedData.text.replace(/\.+$/, '');
              
              // Build accumulated Arabic text - APPEND to end for correct RTL order
              if (accumulatedArabicRef.current === '') {
                accumulatedArabicRef.current = arabicText;
              } else {
                // Check if this new text is longer and contains the previous text
                if (arabicText.length > accumulatedArabicRef.current.length && 
                    arabicText.includes(accumulatedArabicRef.current)) {
                  // New text contains old text, so replace with the longer version
                  accumulatedArabicRef.current = arabicText;
                } else if (!accumulatedArabicRef.current.includes(arabicText)) {
                  // New text is different, append it properly for RTL
                  // For Arabic RTL, we want to append new words to the END
                  accumulatedArabicRef.current = accumulatedArabicRef.current + ' ' + arabicText;
                }
              }
              
              lastTranscriptionTimeRef.current = currentTime;
              
              console.log('🔤 Accumulated Arabic:', accumulatedArabicRef.current);
              
              const transcriptionEntry: TranscriptionEntry = {
                id: `transcription-${Date.now()}`,
                text: accumulatedArabicRef.current,
                timestamp: Date.now(),
                isComplete: false
              };

              setData(prev => {
                // Apply memory limits when adding new entries
                const updatedArabicHistory = [...prev.arabicHistory, transcriptionEntry].slice(-MAX_ARABIC_HISTORY);
                
                return {
                  ...prev,
                  currentArabicTranscription: accumulatedArabicRef.current,
                  arabicHistory: updatedArabicHistory,
                  lastUpdate: Date.now()
                };
              });
              
            } else if (receivedData.type === 'translation' && receivedData.language === 'nl') {
              // Dutch translation - pair with accumulated Arabic and mark as complete
              const translationEntry: TranslationEntry = {
                id: `translation-${Date.now()}`,
                arabicText: accumulatedArabicRef.current || 'نص غير مكتمل', // Use accumulated Arabic
                translatedText: receivedData.text,
                timestamp: Date.now()
              };

              console.log('✅ Completed pair:', { 
                arabic: accumulatedArabicRef.current, 
                dutch: receivedData.text 
              });

              setData(prev => {
                // Apply memory limits when adding new entries
                const updatedTranslations = [...prev.completedTranslations, translationEntry].slice(-MAX_STORED_TRANSLATIONS);
                
                return {
                  ...prev,
                  completedTranslations: updatedTranslations,
                  currentArabicTranscription: '', // Clear current since it's now complete
                  lastUpdate: Date.now(),
                  totalProcessed: prev.totalProcessed + 1
                };
              });
              
              // Clear the accumulated Arabic since this sentence is complete
              accumulatedArabicRef.current = '';
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

    // Set up periodic memory cleanup
    cleanupIntervalRef.current = setInterval(performMemoryCleanup, CLEANUP_INTERVAL);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, [backendUrl, toast]);

  const clearHistory = () => {
    setData(prev => ({
      ...prev,
      completedTranslations: [],
      arabicHistory: [],
      currentArabicTranscription: '',
      totalProcessed: 0,
      sessionStartTime: Date.now()
    }));
    accumulatedArabicRef.current = '';
  };

  // Get session statistics
  const getSessionStats = () => {
    const sessionDuration = Date.now() - data.sessionStartTime;
    return {
      duration: Math.floor(sessionDuration / 1000 / 60), // minutes
      totalProcessed: data.totalProcessed,
      inMemory: data.completedTranslations.length,
      averagePerMinute: data.totalProcessed / Math.max(1, sessionDuration / 1000 / 60)
    };
  };

  return { data, setData, isConnected, clearHistory, getSessionStats, performMemoryCleanup };
}
