import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TranslationLine {
  id: string;
  text: string;
  timestamp: number;
}

const TranslationBox = () => {
  const [lines, setLines] = useState<TranslationLine[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Demo lines for simulation
  const demoLines = [
    "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم",
    "In the name of Allah, the Most Gracious, the Most Merciful",
    "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِين",
    "All praise is due to Allah, Lord of all the worlds",
    "الرَّحْمَنِ الرَّحِيم",
    "The Most Gracious, the Most Merciful",
    "مَالِكِ يَوْمِ الدِّين",
    "Master of the Day of Judgment",
    "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِين",
    "You alone we worship, and You alone we ask for help",
    "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيم",
    "Guide us on the Straight Path",
    "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ",
    "The path of those You have blessed",
    "غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّين",
    "Not the path of those who have incurred Your wrath, nor of those who have gone astray"
  ];

  // Simulate new lines being added
  useEffect(() => {
    let currentIndex = 0;
    
    const addLine = () => {
      if (currentIndex < demoLines.length) {
        const newLine: TranslationLine = {
          id: `line-${Date.now()}-${currentIndex}`,
          text: demoLines[currentIndex],
          timestamp: Date.now(),
        };
        
        setLines(prev => {
          const updated = [...prev, newLine];
          // Keep only the last 10 lines for demo
          return updated.slice(-10);
        });
        
        currentIndex++;
      } else {
        // Reset and start over
        currentIndex = 0;
        setLines([]);
      }
    };

    // Add first line immediately
    addLine();
    
    // Then add a new line every 3 seconds
    const interval = setInterval(addLine, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="translation-box w-full max-w-2xl h-64 p-6 animate-glow">
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
                  delay: 0.1 * (index % 3) // Stagger animation for visual appeal
                }}
                className="translation-text"
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
  );
};

export default TranslationBox;
