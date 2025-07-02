# Islamic Translation Display

A beautiful, real-time translation display application for Islamic content with Arabic transcription and multi-language translation capabilities.

## Features

- **Real-time Arabic Transcription**: Word-by-word Arabic text display with RTL support
- **Live Translation**: Multi-language translation display with dynamic sizing
- **Islamic Design**: Beautiful, responsive UI with dark/light mode support
- **WebSocket Integration**: Real-time backend communication for live translations
- **Overflow Handling**: Smart text overflow management for Arabic transcription
- **Dev Mode**: Built-in testing mode with demo content

## Backend Integration

### Prerequisites

This frontend requires a WebSocket server that provides:
- Arabic speech-to-text transcription
- Real-time translation capabilities
- WebSocket endpoint at `/ws`

### WebSocket Protocol

#### Connection
```javascript
// Development
ws://localhost:8000/ws

// Production (auto-detected)
wss://yourdomain.com/ws  // HTTPS sites
ws://yourdomain.com/ws   // HTTP sites
```

#### Message Format

**Transcription Messages** (Arabic words):
```json
{
  "type": "transcription",
  "text": "بِسْمِ",
  "timestamp": 1703123456789
}
```

**Translation Messages** (Complete sentences):
```json
{
  "type": "translation", 
  "text": "In the name of Allah, the Most Gracious, the Most Merciful",
  "timestamp": 1703123456789
}
```

#### Alternative Field Names
The frontend supports these alternative field names for flexibility:
- `text` or `word` for transcription content
- `text` or `translation` for translation content

### Backend Requirements

Your WebSocket server should:

1. **Accept WebSocket connections** at `/ws` endpoint
2. **Send real-time messages** in the JSON format above
3. **Handle connection lifecycle** (open, close, error states)
4. **Provide Arabic STT** (Speech-to-Text) capability
5. **Provide translation services** to target languages

### Development Setup

1. **Start your backend server** on `localhost:8000`
2. **Ensure WebSocket endpoint** is available at `ws://localhost:8000/ws`
3. **Run this frontend**:
   ```bash
   npm install
   npm run dev
   ```
4. **Test the connection** - you should see connection logs in the browser console

### Testing Without Backend

Use the built-in **Dev Mode**:
1. Click the Dev Mode button (list icon) in the top-right corner
2. Watch demo Arabic words and translations appear automatically
3. Perfect for UI testing and development

### Production Deployment

1. **Configure your WebSocket server** for production environment
2. **Deploy this frontend** using the Lovable platform or your preferred hosting
3. **WebSocket URL auto-detection**:
   - HTTPS sites → `wss://yourdomain.com/ws`
   - HTTP sites → `ws://yourdomain.com/ws`

### Error Handling

- **Auto-reconnection**: Frontend attempts to reconnect every 3 seconds if connection drops
- **Connection status**: Monitor browser console for WebSocket connection logs
- **Fallback content**: Displays "Waiting for..." messages when no data is received

### Example Backend Implementation

For a complete backend example with LiveKit, OpenAI Whisper, and GPT-4, see:
[LiveKit AI Translation Demo](https://github.com/MustfainTariq/LiveKit-ai-translation)

---

## Project info

**URL**: https://lovable.dev/projects/400aa600-71a1-4aa9-865b-ca07fa265098

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/400aa600-71a1-4aa9-865b-ca07fa265098) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/400aa600-71a1-4aa9-865b-ca07fa265098) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
