
import { useState } from 'react';

interface AudioFileInfo {
  name: string;
  size: number;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  isProcessing: boolean;
}

export function useAudioFile() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioFileInfo, setAudioFileInfo] = useState<AudioFileInfo | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    audio.src = url;
    
    audio.onloadedmetadata = () => {
      setAudioFileInfo({
        name: file.name,
        size: file.size,
        duration: audio.duration,
        currentTime: 0,
        isPlaying: false,
        isProcessing: false
      });
      URL.revokeObjectURL(url);
    };
    
    console.log('File selected:', file.name);
  };

  return {
    selectedFile,
    audioFileInfo,
    setAudioFileInfo,
    handleFileSelect
  };
}
