import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Eye, EyeClosed, ListCollapse, Maximize, Camera, CameraOff, Circle, Wifi, WifiOff } from 'lucide-react';
import { splitIntoChunks, calculateReadingDelay } from '@/utils/textAnimator';

interface Word {
  id: string;
  text: string;
  timestamp: number;
}

interface TranslationLine {
  id: string;
  text: string;
  timestamp: number;
}

const KhutbahDisplay = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [lines, setLines] = useState<TranslationLine[]>([]);
  const [showTranscription, setShowTranscription] = useState(true);
  const [isDark, setIsDark] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [isDevMode, setIsDevMode] = useState(false);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [isTickerResetting, setIsTickerResetting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const scrollRef = useRef<HTMLDivElement>(null);
  const translationScrollRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null);

  // Demo Arabic words for simulation
  const demoWords = [
    "بِسْمِ", "اللَّهِ", "الرَّحْمَنِ", "الرَّحِيم", "الْحَمْدُ", "لِلَّهِ", "رَبِّ", "الْعَالَمِين",
    "الرَّحْمَنِ", "الرَّحِيم", "مَالِكِ", "يَوْمِ", "الدِّين", "إِيَّاكَ", "نَعْبُدُ", "وَإِيَّاكَ",
    "نَسْتَعِين", "اهْدِنَا", "الصِّرَاطَ", "الْمُسْتَقِيم", "صِرَاطَ", "الَّذِينَ", "أَنْعَمْتَ", "عَلَيْهِمْ"
  ];

  // Demo translations
  const demoLines = [
    "In the name of Allah, the Most Gracious, the Most Merciful",
    "All praise is due to Allah, Lord of all the worlds",
    "The Most Gracious, the Most Merciful",
    "Master of the Day of Judgment",
    "You alone we worship, and You alone we ask for help",
    "Guide us on the Straight Path",
    "The path of those You have blessed",
    "Not the path of those who have incurred Your wrath, nor of those who have gone astray"
  ];

  // Check if text overflows container width
  const checkTextOverflow = () => {
    if (!textContainerRef.current || !textContentRef.current) return false;
    
    const containerWidth = textContainerRef.current.offsetWidth;
    const contentWidth = textContentRef.current.scrollWidth;
    
    return contentWidth > containerWidth;
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  // WebSocket connection for real-time transcription and translation
  useEffect(() => {
    // Use configurable WebSocket URL - defaults to localhost:8765 for development
    const wsUrl = process.env.NODE_ENV === 'development' 
      ? 'ws://localhost:8765'
      : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
    
    const ws = new WebSocket(wsUrl);
    setConnectionStatus('connecting');
    
    ws.onopen = () => {
      console.log('Connected to WebSocket server at:', wsUrl);
      setConnectionStatus('connected');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data);
        
        if (data.type === 'transcription') {
          // Handle incoming transcription words - each word comes individually
          const newWord: Word = {
            id: `word-${Date.now()}-${Math.random()}`,
            text: data.text || data.word || '',
            timestamp: data.timestamp || Date.now(),
          };
          
          setWords(prev => {
            const updated = [...prev, newWord];
            // Check on next frame if text overflows after adding this word
            setTimeout(() => {
              if (checkTextOverflow()) {
                // Start fade-out animation
                setIsTickerResetting(true);
                setTimeout(() => {
                  setWords([newWord]); // Reset with only the new word
                  setIsTickerResetting(false); // Fade back in
                }, 150); // Animation duration
              }
            }, 0);
            return updated;
          });
        } else if (data.type === 'translation') {
          // Handle incoming translation lines - complete sentences
          const newLine: TranslationLine = {
            id: `line-${Date.now()}-${Math.random()}`,
            text: data.text || data.translation || '',
            timestamp: data.timestamp || Date.now(),
          };
          
          setLines(prev => {
            const updated = [...prev, newLine];
            // Keep only the last 15 lines for display (newest at bottom)
            const finalLines = updated.slice(-15);
            
            // Set this new line as active and schedule its deactivation
            setActiveLineId(newLine.id);
            const chunks = splitIntoChunks(newLine.text);
            const totalAnimationTime = chunks.reduce((acc, chunk, index) => {
              const chunkWords = chunk.split(' ').length;
              const delay = chunks.slice(0, index).reduce((delayAcc, prevChunk) => {
                return delayAcc + calculateReadingDelay(prevChunk.split(' ').length);
              }, 0);
              return Math.max(acc, delay + calculateReadingDelay(chunkWords) + 300); // +300ms for animation duration
            }, 0);
            
            setTimeout(() => setActiveLineId(null), totalAnimationTime);
            
            return finalLines;
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error, event.data);
      }
    };
    
    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      setConnectionStatus('disconnected');
      // Auto-reconnect after 3 seconds if connection is lost
      if (event.code !== 1000) {
        setTimeout(() => {
          console.log('Attempting to reconnect...');
          // This will trigger a re-render and reconnection
        }, 3000);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
    };
    
    // Cleanup on component unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Component unmounting');
      }
    };
  }, []);

  // Dev mode simulation
  useEffect(() => {
    if (!isDevMode) return;

    let wordIndex = 0;
    let lineIndex = 0;

    // Simulate Arabic words
    const addWord = () => {
      if (wordIndex < demoWords.length) {
        const newWord: Word = {
          id: `dev-word-${Date.now()}-${wordIndex}`,
          text: demoWords[wordIndex],
          timestamp: Date.now(),
        };
        
        setWords(prev => {
          const updated = [...prev, newWord];
          // Check on next frame if text overflows after adding this word
          setTimeout(() => {
            if (checkTextOverflow()) {
              // Start fade-out animation
              setIsTickerResetting(true);
              setTimeout(() => {
                setWords([newWord]); // Reset with only the new word
                setIsTickerResetting(false); // Fade back in
              }, 150); // Animation duration
            }
          }, 0);
          return updated;
        });
        
        wordIndex++;
      } else {
        wordIndex = 0;
        setWords([]);
      }
    };

    // Simulate translation lines
    const addLine = () => {
      if (lineIndex < demoLines.length) {
        const newLine: TranslationLine = {
          id: `dev-line-${Date.now()}-${lineIndex}`,
          text: demoLines[lineIndex],
          timestamp: Date.now(),
        };
        
        setLines(prev => {
          const updated = [...prev, newLine];
          const finalLines = updated.slice(-15);
          
          // Set this new line as active for dev mode too
          setActiveLineId(newLine.id);
          const chunks = splitIntoChunks(newLine.text);
          const totalAnimationTime = chunks.reduce((acc, chunk, index) => {
            const chunkWords = chunk.split(' ').length;
            const delay = chunks.slice(0, index).reduce((delayAcc, prevChunk) => {
              return delayAcc + calculateReadingDelay(prevChunk.split(' ').length);
            }, 0);
            return Math.max(acc, delay + calculateReadingDelay(chunkWords) + 300);
          }, 0);
          
          setTimeout(() => setActiveLineId(null), totalAnimationTime);
          
          return finalLines;
        });
        
        lineIndex++;
      } else {
        lineIndex = 0;
        setLines([]);
      }
    };

    // Start with first word and line
    addWord();
    const lineTimeout = setTimeout(addLine, 1000);
    
    // Continue adding words every 800ms and lines every 4s
    const wordInterval = setInterval(addWord, 800);
    const lineInterval = setInterval(addLine, 4000);
    
    return () => {
      clearTimeout(lineTimeout);
      clearInterval(wordInterval);
      clearInterval(lineInterval);
    };
  }, [isDevMode]);

  // Auto-scroll to bottom when new translations are added
  useEffect(() => {
    if (translationScrollRef.current) {
      translationScrollRef.current.scrollTop = translationScrollRef.current.scrollHeight;
    }
  }, [lines]);

  // Horizontal auto-scroll for Arabic ticker
  useEffect(() => {
    if (textContentRef.current && textContainerRef.current) {
      // Scroll the horizontal container to the far right (for RTL)
      textContainerRef.current.scrollLeft = textContentRef.current.scrollWidth;
    }
  }, [words]);

  // Apply dark mode class on mount based on initial state
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col">
      {/* Header with controls - hidden in fullscreen mode */}
      {!isFullscreen && (
        <>
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="fixed top-6 right-6 p-3 rounded-full bg-card/20 border border-border/30 hover:bg-card/30 transition-colors z-10"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-foreground" />
            ) : (
              <Moon className="w-5 h-5 text-foreground" />
            )}
          </button>

          {/* Transcription toggle */}
          <button
            onClick={() => setShowTranscription(!showTranscription)}
            className="fixed top-6 right-20 p-3 rounded-full bg-card/20 border border-border/30 hover:bg-card/30 transition-colors z-10"
            aria-label="Toggle transcription visibility"
          >
            {showTranscription ? (
              <Eye className="w-5 h-5 text-foreground" />
            ) : (
              <EyeClosed className="w-5 h-5 text-foreground" />
            )}
          </button>

          {/* Camera toggle */}
          <button
            onClick={() => setShowCamera(!showCamera)}
            className="fixed top-6 right-36 p-3 rounded-full bg-card/20 border border-border/30 hover:bg-card/30 transition-colors z-10"
            aria-label="Toggle camera visibility"
          >
            {showCamera ? (
              <Camera className="w-5 h-5 text-foreground" />
            ) : (
              <CameraOff className="w-5 h-5 text-foreground" />
            )}
          </button>

          {/* Dev mode toggle */}
          <button
            onClick={() => setIsDevMode(!isDevMode)}
            className={`fixed top-6 right-52 p-3 rounded-full border border-border/30 hover:bg-card/30 transition-colors z-10 ${
              isDevMode ? 'bg-primary/20 text-primary' : 'bg-card/20 text-foreground'
            }`}
            aria-label="Toggle dev mode"
          >
            <ListCollapse className="w-5 h-5" />
          </button>

          {/* Connection status indicator */}
          <div className="fixed top-6 left-6 p-2 z-10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {connectionStatus === 'connected' ? (
                <Wifi className="w-3 h-3 text-primary/60" />
              ) : connectionStatus === 'connecting' ? (
                <Wifi className="w-3 h-3 text-muted-foreground/50 animate-pulse" />
              ) : (
                <WifiOff className="w-3 h-3 text-muted-foreground/40" />
              )}
            </div>
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="fixed top-6 right-[17rem] p-3 rounded-full bg-card/20 border border-border/30 hover:bg-card/30 transition-colors z-10"
            aria-label="Toggle fullscreen mode"
          >
            <Maximize className="w-5 h-5 text-foreground" />
          </button>
        </>
      )}

      {/* Floating fullscreen exit button - only visible in fullscreen mode */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="fixed top-4 right-4 p-2 rounded-full bg-card/10 border border-border/20 hover:bg-card/20 transition-all opacity-60 hover:opacity-100 z-20"
          aria-label="Exit fullscreen mode"
        >
          <Circle className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      {/* Container for three vertical sections */}
      <div className={`${isFullscreen ? 'mt-0' : 'mt-16'} flex-1 mb-6 flex flex-col gap-4 p-4`}>
        {/* 1. Arabic Transcription Box - Top */}
        <AnimatePresence>
          {showTranscription && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="transcription-container w-[calc(100vw-3rem)] mx-auto p-3 sm:p-4 md:p-6">
                <div ref={textContainerRef} className="h-full overflow-hidden flex items-center justify-center">
                  <div className="w-full text-right" dir="rtl">
                    <motion.div 
                      ref={textContentRef} 
                      className="inline-flex gap-2 justify-end whitespace-nowrap"
                      animate={{ opacity: isTickerResetting ? 0 : 1 }}
                      transition={{ duration: 0.15, ease: 'easeInOut' }}
                    >
                      <AnimatePresence>
                        {words.map((word, index) => (
                          <motion.span
                            key={word.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ 
                              duration: 0.3, 
                              ease: "easeOut"
                            }}
                            className="translation-text"
                          >
                            {word.text}
                          </motion.span>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                    
                    {words.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="translation-text text-muted-foreground text-center w-full"
                      >
                        انتظار النص العربي...
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Camera Feed Placeholder - Middle - conditional rendering */}
        {showCamera && (
          <div className="w-full max-w-7xl mx-auto h-[30vh] bg-black rounded-xl shadow-inner flex items-center justify-center">
            <span className="text-gray-400 text-lg">Visuals / Camera Feed Area</span>
          </div>
        )}

        {/* 3. Dutch Translation Box - Bottom */}
        <div 
          ref={translationScrollRef}
          className="translation-container w-[calc(100vw-3rem)] mx-auto overflow-y-auto scrollbar-hide flex flex-col justify-end p-4"
        >
          <div className="text-left translation-text">
            {lines.length > 0 ? (
              <div className="space-y-2">
                {lines.map((line, lineIndex) => {
                  const chunks = splitIntoChunks(line.text);
                  const isActive = activeLineId === line.id;
                  return (
                    <div 
                      key={line.id} 
                      className={`flex flex-wrap gap-1 ${isActive ? 'translation-line-active' : ''}`}
                    >
                      <AnimatePresence>
                        {chunks.map((chunk, chunkIndex) => {
                          // Calculate cumulative delay based on previous chunks' reading time
                          const delay = chunks.slice(0, chunkIndex).reduce((acc, prevChunk) => {
                            return acc + calculateReadingDelay(prevChunk.split(' ').length);
                          }, 0) / 1000; // Convert to seconds for Framer Motion
                          
                          return (
                            <motion.span
                              key={`${line.id}-chunk-${chunkIndex}`}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.3,
                                ease: "easeOut",
                                delay: delay
                              }}
                              className="text-foreground"
                            >
                              {chunk}
                            </motion.span>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-muted-foreground text-center"
              >
                Waiting for translation...
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KhutbahDisplay;
