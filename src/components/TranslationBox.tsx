import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Eye, EyeClosed } from 'lucide-react';

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
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  // Simulate Arabic words being added
  useEffect(() => {
    let currentWordIndex = 0;
    
    const addWord = () => {
      if (currentWordIndex < demoWords.length) {
        const newWord: Word = {
          id: `word-${Date.now()}-${currentWordIndex}`,
          text: demoWords[currentWordIndex],
          timestamp: Date.now(),
        };
        
        setWords(prev => {
          const updated = [...prev, newWord];
          // Keep only the last 20 words for demo
          return updated.slice(-20);
        });
        
        currentWordIndex++;
      } else {
        // Reset and start over
        currentWordIndex = 0;
        setWords([]);
      }
    };

    // Add first word immediately
    addWord();
    
    // Then add a new word every 0.5 seconds
    const interval = setInterval(addWord, 500);
    
    return () => clearInterval(interval);
  }, []);

  // Simulate translation lines being added
  useEffect(() => {
    let currentLineIndex = 0;
    
    const addLine = () => {
      if (currentLineIndex < demoLines.length) {
        const newLine: TranslationLine = {
          id: `line-${Date.now()}-${currentLineIndex}`,
          text: demoLines[currentLineIndex],
          timestamp: Date.now(),
        };
        
        setLines(prev => {
          const updated = [...prev, newLine];
          // Keep only the last 8 lines for demo
          return updated.slice(-8);
        });
        
        currentLineIndex++;
      } else {
        // Reset and start over
        currentLineIndex = 0;
        setLines([]);
      }
    };

    // Add first line after 1 second
    const timeout = setTimeout(addLine, 1000);
    
    // Then add a new line every 3 seconds
    const interval = setInterval(addLine, 3000);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // Auto-scroll translation box to bottom when new lines are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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

      {/* Arabic Transcription Box */}
      <AnimatePresence>
        {showTranscription && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mt-16 mb-8"
          >
            <div className="translation-box w-full max-w-4xl mx-auto h-24 p-6">
              <div className="h-full overflow-hidden">
                <div className="text-right dir-rtl space-x-reverse space-x-2 flex flex-wrap-reverse justify-end content-end">
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
                        className="translation-text inline-block ml-2"
                      >
                        {word.text}
                      </motion.span>
                    ))}
                  </AnimatePresence>
                  
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

      {/* Translation Box - extends to bottom */}
      <div className="flex-1 mb-6 flex flex-col">
        <div 
          className="translation-box w-full max-w-4xl mx-auto flex-1 p-6"
          style={{ 
            minHeight: showTranscription ? 'calc(100vh - 280px)' : 'calc(100vh - 160px)'
          }}
        >
          <div 
            ref={scrollRef}
            className="h-full overflow-y-auto scrollbar-hide space-y-3"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <AnimatePresence mode="popLayout">
              {lines.map((line, index) => (
                <motion.div
                  key={line.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ 
                    duration: 0.5, 
                    ease: "easeOut",
                    delay: 0.1 * (index % 3)
                  }}
                  className="translation-text text-left"
                >
                  {line.text}
                </motion.div>
              ))}
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
    </div>
  );
};

export default KhutbahDisplay;
