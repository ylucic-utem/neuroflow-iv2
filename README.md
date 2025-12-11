<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally or deploy to Render.com.

View your app in AI Studio: https://ai.studio/apps/drive/1Dflt_9eVDedZYTla0cRs0v1ZiUVThmJh

## Features

- **Visual Session Programming**: Use React Flow to create therapy protocols with drag-and-drop nodes
- **Binaural Beat Therapy**: Advanced audio engine with isochronic tones and binaural beats
- **AI Assistant**: Powered by Google Gemini for therapy guidance
- **Clinical Interface**: Designed for healthcare professionals to program patient sessions

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in `.env.local`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

## Deploy to Render.com

### Method 1: Using render.yaml (Recommended)

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" → "Blueprint"
4. Connect your GitHub repository
5. Render will automatically detect `render.yaml` and configure the service
6. Add your `GEMINI_API_KEY` environment variable in the Render dashboard

### Method 2: Manual Setup

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Add Environment Variable**: `GEMINI_API_KEY`
5. Click "Create Static Site"

### React Flow Compatibility

✅ **Fully Compatible** - React Flow (`@xyflow/react`) is a pure client-side React library that works perfectly with:
- Static site hosting (Render.com, Netlify, Vercel)
- SPAs (Single Page Applications)
- Vite builds
- No server-side rendering required

The app bundles to static assets (HTML, CSS, JS) that can be served from any CDN or static host.

## Technology Stack

- **React 19** + **TypeScript**
- **React Flow** - Visual programming interface
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Google Gemini AI** - AI assistance
- **Web Audio API** - Audio synthesis
- **Three.js** - 3D visualizations

## Session Programming

Clinicians can create therapy protocols using visual nodes:

- **Start Node**: Session entry point
- **Therapy Block**: Fixed binaural beat frequencies
- **Iso-Ramp**: Dynamic frequency transitions
- **End Node**: Session termination

Connect nodes to create sequential therapy programs that execute automatically.
