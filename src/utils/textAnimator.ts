/**
 * Splits a sentence into optimal reading chunks of 3-5 words
 * @param text The full sentence to split
 * @param chunkSize The desired number of words per chunk (default: 4)
 * @returns Array of word chunks
 */
export function splitIntoChunks(text: string, chunkSize: number = 4): string[] {
  const words = text.trim().split(/\s+/);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  
  return chunks;
}

/**
 * Calculates reading speed delay based on word count
 * @param wordCount Number of words in the chunk
 * @param wpm Words per minute (default: 240)
 * @returns Delay in milliseconds
 */
export function calculateReadingDelay(wordCount: number, wpm: number = 240): number {
  // Convert WPM to milliseconds per word, with a minimum delay
  const msPerWord = (60 * 1000) / wpm;
  return Math.max(wordCount * msPerWord, 150); // Minimum 150ms delay
}