# AI Feedback Analyser

An intelligent, AI-powered feedback analysis tool that automatically extracts sentiment, emotion, and key aspects from user feedback.

## Features

- **AI-Powered Analysis**: Automatically detects sentiment (Positive, Neutral, Negative), nuanced emotions, and extracts key phrases from text feedback.
- **Smart Aspect Extraction**: Identifies specific features mentioned in feedback and their individual sentiments.
- **Toxicity Detection**: Flags potentially abusive or spam feedback.
- **Interactive Dashboard**: Visualizes feedback trends, emotions, and metrics with beautiful, modern charts.
- **Admin Panel**: Manage users and handle flagged content.

## Getting Started

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your AI API key:
   ```env
   API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Build for Production

```bash
npm run build
```

## Technologies Used

- React 19
- Vite
- Recharts for data visualization
- Google GenAI SDK
- Tailwind-inspired custom CSS with glassmorphic and holographic themes
