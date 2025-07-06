
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface SettingsPanelProps {
  backendUrl: string;
  customPrompt: string;
  onBackendUrlChange: (url: string) => void;
  onCustomPromptChange: (prompt: string) => void;
  onUpdatePrompt: () => void;
}

export default function SettingsPanel({
  backendUrl,
  customPrompt,
  onBackendUrlChange,
  onCustomPromptChange,
  onUpdatePrompt
}: SettingsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="backend-url">Backend URL</Label>
          <input
            id="backend-url"
            type="text"
            value={backendUrl}
            onChange={(e) => onBackendUrlChange(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="ws://localhost:8000"
          />
        </div>
        <div>
          <Label htmlFor="custom-prompt">Translation Prompt</Label>
          <Textarea
            id="custom-prompt"
            value={customPrompt}
            onChange={(e) => onCustomPromptChange(e.target.value)}
            rows={6}
            className="w-full"
          />
          <Button onClick={onUpdatePrompt} className="mt-2">
            Update Prompt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
