import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Eye, EyeClosed, ListCollapse } from 'lucide-react';

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
  const scrollRef = useRef<HTMLDivElement>(null);
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
    // Use configurable WebSocket URL - defaults to localhost:8000 for development
    const wsUrl = process.env.NODE_ENV === 'development' 
      ? 'ws://localhost:8000/ws'
      : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('Connected to WebSocket server at:', wsUrl);
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
                setWords([newWord]);
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
            const updated = [newLine, ...prev];
            // Keep only the first 15 lines for display (newest at top)
            return updated.slice(0, 15);
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error, event.data);
      }
    };
    
    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
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
              setWords([newWord]);
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
          const updated = [newLine, ...prev];
          return updated.slice(0, 15);
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

  // Keep scroll at top since newest translations appear at top
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [lines]);

  // Apply dark mode class on mount based on initial state
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-6 flex flex-col">
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

      {/* Dev mode toggle */}
      <button
        onClick={() => setIsDevMode(!isDevMode)}
        className={`fixed top-6 right-36 p-3 rounded-full border border-border/30 hover:bg-card/30 transition-colors z-10 ${
          isDevMode ? 'bg-primary/20 text-primary' : 'bg-card/20 text-foreground'
        }`}
        aria-label="Toggle dev mode"
      >
        <ListCollapse className="w-5 h-5" />
      </button>

      {/* Container for both boxes with consistent spacing */}
      <div className="mt-16 flex-1 mb-6 flex flex-col">
        {/* Translation Box - fixed height to prevent pushing down Arabic box */}
        <div className="mb-8">
          <div className="translation-box w-full max-w-7xl mx-auto h-[calc(100vh-280px)] p-3 sm:p-4 md:p-6">
            <div 
              ref={scrollRef}
              className="h-full overflow-hidden flex flex-col justify-start items-center pt-[10%]"
            >
              <AnimatePresence mode="popLayout">
                {lines.map((line, index) => {
                  // Make the first line much larger and more prominent
                  const sizeScale = index === 0 ? 1.8 : Math.max(0.5, 1 - (index * 0.12));
                  const spacing = index === 0 ? "mb-8" : "mb-2";
                  
                  return (
                    <motion.div
                      key={line.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: Math.max(0.15, 1 - (index * 0.1)), y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ 
                        duration: 0.5, 
                        ease: "easeOut",
                        delay: 0.05 * index
                      }}
                      className={`translation-text text-center ${spacing}`}
                      style={{
                        opacity: Math.max(0.15, 1 - (index * 0.1)),
                        fontSize: `clamp(${1.125 * sizeScale}rem, ${3.5 * sizeScale}vw, ${4.5 * sizeScale}rem)`
                      }}
                    >
                      {line.text}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {lines.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="translation-text text-muted-foreground text-center"
                >
                  Waiting for translation...
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Arabic Transcription Box */}
        <AnimatePresence>
          {showTranscription && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="translation-box w-full max-w-7xl mx-auto h-16 sm:h-20 md:h-24 lg:h-28 p-3 sm:p-4 md:p-6">
                <div ref={textContainerRef} className="h-full overflow-hidden flex items-center justify-center">
                  <div className="w-full text-right" dir="rtl">
                    <div ref={textContentRef} className="inline-flex gap-2 justify-end whitespace-nowrap">
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
                    </div>
                    
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
      </div>
    </div>
  );
};

export default KhutbahDisplay;
