
import React from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface RecordingControlsProps {
  isRecording: boolean;
  isConnected: boolean;
  selectedLanguage: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClear: () => void;
  onToggleSettings: () => void;
  onLanguageChange: (language: string) => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'nl', name: 'Dutch' }
];

export default function RecordingControls({
  isRecording,
  isConnected,
  selectedLanguage,
  onStartRecording,
  onStopRecording,
  onClear,
  onToggleSettings,
  onLanguageChange
}: RecordingControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex gap-2">
        <Button
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={!isConnected}
          className={`${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
        >
          {isRecording ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {isRecording ? 'Stop' : 'Start'}
        </Button>
        <Button variant="outline" onClick={onClear}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Clear
        </Button>
        <Button variant="outline" onClick={onToggleSettings}>
          <Settings className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Label htmlFor="language-select">Language:</Label>
        <Select value={selectedLanguage} onValueChange={onLanguageChange}>
          <SelectTrigger id="language-select" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
