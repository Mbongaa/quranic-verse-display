
import React, { useRef } from 'react';
import { Upload, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

interface AudioFileInfo {
  name: string;
  size: number;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  isProcessing: boolean;
}

interface FileUploadSectionProps {
  selectedFile: File | null;
  isUploading: boolean;
  isConnected: boolean;
  audioFileInfo: AudioFileInfo | null;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFileUpload: () => void;
  onAudioPlay: () => void;
  onAudioPause: () => void;
  onAudioTimeUpdate: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

export default function FileUploadSection({
  selectedFile,
  isUploading,
  isConnected,
  audioFileInfo,
  onFileSelect,
  onFileUpload,
  onAudioPlay,
  onAudioPause,
  onAudioTimeUpdate,
  audioRef
}: FileUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={onFileSelect}
            className="w-64"
          />
          <Button
            onClick={onFileUpload}
            disabled={!selectedFile || !isConnected || isUploading}
            variant="outline"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload & Process'}
          </Button>
        </div>
      </div>

      {audioFileInfo && (
        <Card className="bg-slate-50">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{audioFileInfo.name}</p>
                  <p className="text-xs text-gray-600">
                    {formatFileSize(audioFileInfo.size)} • {formatTime(audioFileInfo.duration)}
                  </p>
                </div>
                {audioFileInfo.isProcessing && (
                  <span className="text-xs text-blue-600">Processing...</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={audioFileInfo.isPlaying ? onAudioPause : onAudioPlay}
                  disabled={audioFileInfo.isProcessing}
                >
                  {audioFileInfo.isPlaying ? (
                    <Pause className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                </Button>
                <span className="text-xs text-gray-600">
                  {formatTime(audioFileInfo.currentTime)} / {formatTime(audioFileInfo.duration)}
                </span>
              </div>

              <Progress 
                value={(audioFileInfo.currentTime / audioFileInfo.duration) * 100} 
                className="h-2"
              />

              {selectedFile && (
                <audio
                  ref={audioRef}
                  src={URL.createObjectURL(selectedFile)}
                  onTimeUpdate={onAudioTimeUpdate}
                  onEnded={() => {/* handled in parent */}}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
