import { FeedbackData, DashboardMetrics, Sentiment, UserData } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

// Initialize AI
// Note: In a production app, calls should be proxied through a backend to protect the key,
// or use Firebase App Check. For this demo, we use the env var directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Start with empty feedback for accurate zero-state calculations
const INITIAL_FEEDBACKS: FeedbackData[] = [];

const INITIAL_USERS: UserData[] = [
    { email: 'admin@system.com', isAdmin: true, isBanned: false },
    { email: 'alice@example.com', isAdmin: false, isBanned: false },
    { email: 'bob@example.com', isAdmin: false, isBanned: false },
    { email: 'charlie@example.com', isAdmin: false, isBanned: false },
    { email: 'troll@bad.com', isAdmin: false, isBanned: true }
];

class DataService {
  private listeners: (() => void)[] = [];

  constructor() {
    if (!localStorage.getItem('feedbacks')) {
      localStorage.setItem('feedbacks', JSON.stringify(INITIAL_FEEDBACKS));
    }
    if (!localStorage.getItem('app_users')) {
      localStorage.setItem('app_users', JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem('admin_passcode')) {
        localStorage.setItem('admin_passcode', '1234');
    }
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getAllFeedbacks(): FeedbackData[] {
    return JSON.parse(localStorage.getItem('feedbacks') || '[]');
  }

  getUsers(): UserData[] {
      return JSON.parse(localStorage.getItem('app_users') || '[]');
  }

  getUser(email: string): UserData | undefined {
      const users = this.getUsers();
      return users.find(u => u.email === email);
  }

  getAdminPasscode(): string {
      return localStorage.getItem('admin_passcode') || '1234';
  }

  setAdminPasscode(code: string) {
      localStorage.setItem('admin_passcode', code);
  }

  async addFeedback(data: Omit<FeedbackData, 'id' | 'sentimentLabel' | 'sentimentMismatch' | 'abusiveWords' | 'flagged' | 'emotion' | 'keywords' | 'aspects'>): Promise<FeedbackData> {
    
    // --- AI ANALYSIS ---
    let aiResult = {
      sentiment: Sentiment.NEUTRAL,
      emotion: 'Neutral',
      keywords: [],
      aspects: [],
      flagged: false
    };

    try {
      const modelId = 'gemini-1.5-flash'; 
      
      // Advanced Prompt Engineering for sophisticated analysis
      const prompt = `
        ROLE: You are an expert Linguistic Psychologist specializing in high-fidelity Sentiment and Emotion Analysis.
        
        CONTEXT:
        A user has provided feedback for an application. You are given their text comment, their numerical rating (1-5 stars), and whether they would recommend the product.
        
        INPUT DATA:
        - Text: "${data.text}"
        - Rating: ${data.rating}/5 stars
        - Recommend: ${data.recommend}

        TASK:
        Analyze the feedback to extract precise emotional and semantic data. Use the rating and recommendation as additional context to resolve ambiguity in the text.

        GUIDELINES:
        - If the text is brief or ambiguous (e.g., "Okay"), use the Rating/Recommend status to determine Sentiment.
        - If the text explicitly contradicts the rating (e.g., "Love it" with 1 star), identify the sentiment of the TEXT but ensure 'flagged' is true to indicate a mismatch.
        - Sarcasm Detection: Be alert for sarcasm if the text is positive but the rating is very low.

        EXAMPLES:
        1. Text: "It is fine." Rating: 4. Rec: Yes. -> Sentiment: Positive, Emotion: Contentment.
        2. Text: "It is fine." Rating: 2. Rec: No. -> Sentiment: Negative, Emotion: Disappointed Indifference.
        3. Text: "Amazing app, but it crashes." Rating: 3. Rec: Maybe. -> Sentiment: Neutral, Emotion: Frustrated Appreciation.
        4. Text: "food is delicious" Rating: 1. Rec: No. -> Sentiment: Positive, Emotion: Sarcastic Amusement, Mismatch: true.

        REQUIREMENTS:
        1. Emotion Analysis: Identify the specific, high-resolution emotional state. 
           - STRICTLY FORBIDDEN: Basic labels like "Happy", "Sad", "Neutral", "Good", "Bad", "Approval".
           - REQUIRED: Use sophisticated, nuanced vocabulary (e.g., "Frustrated Anticipation", "Grateful Relief", "Skeptical Curiosity", "Indignant Rage", "Delighted Surprise", "Exasperated Fatigue").
        2. Keywords: Extract exactly the top 3 most significant nouns or concepts.
        3. Sentiment: Classify the overall polarity (Positive, Neutral, Negative).
        4. Aspects: Identify specific features mentioned (e.g., UI, Performance, Support) and their individual sentiment.
        5. Mismatch: Set to true if there is a severe contradiction between the text sentiment and the numerical rating.
        6. Flagged: Set to true if the content is toxic, abusive, or spam.
      `;
      
      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sentiment: { type: Type.STRING, enum: ["Positive", "Neutral", "Negative"] },
              emotion: { type: Type.STRING, description: "A precise, sophisticated emotional label. Do not use simple words." },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              aspects: { 
                type: Type.ARRAY, 
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    sentiment: { type: Type.STRING, enum: ["Positive", "Neutral", "Negative"] }
                  }
                }
              },
              mismatch: { type: Type.BOOLEAN, description: "True if text/rating mismatch." },
              flagged: { type: Type.BOOLEAN, description: "True if toxic or spam." }
            }
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        aiResult = {
          sentiment: parsed.sentiment as Sentiment,
          emotion: parsed.emotion,
          keywords: parsed.keywords || [],
          aspects: parsed.aspects || [],
          flagged: parsed.flagged || false,
          mismatch: parsed.mismatch || false
        };
      }
    } catch (error) {
      console.error("AI Analysis Failed, falling back to basic logic", error);
      // Fallback simple logic - improved to consider rating
      const lower = data.text.toLowerCase();
      if (data.rating >= 4) aiResult.sentiment = Sentiment.POSITIVE;
      else if (data.rating <= 2) aiResult.sentiment = Sentiment.NEGATIVE;
      else aiResult.sentiment = Sentiment.NEUTRAL;

      // refine with text if text is strong
      if (lower.includes('bad') || lower.includes('terrible') || lower.includes('awful')) aiResult.sentiment = Sentiment.NEGATIVE;
      if (lower.includes('good') || lower.includes('love') || lower.includes('amazing') || lower.includes('delicious')) aiResult.sentiment = Sentiment.POSITIVE;
      
      aiResult.emotion = "Analysis Unavailable";
      (aiResult as any).mismatch = false;
    }

    // Mismatch detection logic
    let mismatch = (aiResult as any).mismatch || false;
    if (data.rating >= 4 && aiResult.sentiment === Sentiment.NEGATIVE) mismatch = true;
    if (data.rating <= 2 && aiResult.sentiment === Sentiment.POSITIVE) mismatch = true;

    const newFeedback: FeedbackData = {
      ...data,
      id: Date.now().toString(),
      sentimentLabel: aiResult.sentiment,
      sentimentMismatch: mismatch,
      emotion: aiResult.emotion,
      keywords: aiResult.keywords,
      aspects: aiResult.aspects,
      flagged: aiResult.flagged || mismatch,
      abusiveWords: aiResult.flagged ? ['Flagged by AI'] : []
    };

    const current = this.getAllFeedbacks();
    const updated = [newFeedback, ...current];
    localStorage.setItem('feedbacks', JSON.stringify(updated));
    
    // Update user list if new
    const users = this.getUsers();
    if (!users.find(u => u.email === data.userEmail)) {
        users.push({ email: data.userEmail, isAdmin: false, isBanned: false });
        localStorage.setItem('app_users', JSON.stringify(users));
    }

    this.notify();
    return newFeedback;
  }

  deleteFeedback(id: string) {
      const current = this.getAllFeedbacks();
      const updated = current.filter(f => f.id !== id);
      localStorage.setItem('feedbacks', JSON.stringify(updated));
      this.notify();
  }

  toggleFlag(id: string) {
      const current = this.getAllFeedbacks();
      const updated = current.map(f => f.id === id ? { ...f, flagged: !f.flagged } : f);
      localStorage.setItem('feedbacks', JSON.stringify(updated));
      this.notify();
  }

  blockUser(email: string) {
      const users = this.getUsers();
      const updated = users.map(u => u.email === email ? { ...u, isBanned: true } : u);
      if (!users.find(u => u.email === email)) {
          updated.push({ email, isAdmin: false, isBanned: true });
      }
      localStorage.setItem('app_users', JSON.stringify(updated));
      this.notify();
  }

  unblockUser(email: string) {
      const users = this.getUsers();
      const updated = users.map(u => u.email === email ? { ...u, isBanned: false } : u);
      localStorage.setItem('app_users', JSON.stringify(updated));
      this.notify();
  }

  isUserBanned(email: string): boolean {
      const user = this.getUser(email);
      return !!user?.isBanned;
  }

  updateUserStatus(email: string, status: Partial<UserData>) {
      const users = this.getUsers();
      const updated = users.map(u => u.email === email ? { ...u, ...status } : u);
      if (!users.find(u => u.email === email)) {
        updated.push({ email, isAdmin: false, isBanned: false, ...status });
      }
      localStorage.setItem('app_users', JSON.stringify(updated));
      this.notify();
  }

  getDashboardMetrics(): DashboardMetrics {
    const feedbacks = this.getAllFeedbacks();
    const total = feedbacks.length;
    const pos = feedbacks.filter(f => f.sentimentLabel === Sentiment.POSITIVE).length;
    const neu = feedbacks.filter(f => f.sentimentLabel === Sentiment.NEUTRAL).length;
    const neg = feedbacks.filter(f => f.sentimentLabel === Sentiment.NEGATIVE).length;

    // Trend Data
    const trendData = feedbacks.slice(0, 10).reverse().map((f, i) => ({
        name: `T-${i}`,
        pos: f.sentimentLabel === Sentiment.POSITIVE ? 100 : 0,
        neu: f.sentimentLabel === Sentiment.NEUTRAL ? 50 : 0,
        neg: f.sentimentLabel === Sentiment.NEGATIVE ? 100 : 0
    }));

    // Aggregate Real Keywords directly from text (Client-side extraction)
    const keywordCounts: Record<string, number> = {};
    const stopWords = new Set([
      'the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after', 
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'but', 'or', 'so', 
      'as', 'if', 'when', 'than', 'because', 'while', 'where', 'this', 'that', 'these', 'those', 'it', 'i', 'you', 'he', 'she', 
      'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'our', 'their', 'not', 'no', 'nor', 'only', 'own', 
      'same', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'could', 'would', 'really', 'some', 'like', 'get', 'more',
      'there', 'what', 'which', 'who', 'whom', 'whose', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'most', 'other', 'some', 'such',
      'out', 'see', 'look', 'make', 'day', 'time', 'year', 'good', 'bad', 'great', 'well', 'say', 'go', 'come', 'take', 'want', 'even', 'way'
    ]);

    feedbacks.forEach(f => {
      if (!f.text) return;
      // Normalize text: lowercase, remove non-alphanumeric (keep spaces), split by whitespace
      const words = f.text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/);

      words.forEach(word => {
        // Filter out short words (length <= 3) and stop words
        if(word.length > 3 && !stopWords.has(word)) {
           keywordCounts[word] = (keywordCounts[word] || 0) + 1;
        }
      });
    });
    
    // Updated: Only top 5 most frequent words
    const topKeywords = Object.entries(keywordCounts)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 5) 
        .map(([text, count]) => ({ text, count }));

    // Aggregate Real Emotions
    const emotionCounts: Record<string, number> = {};
    feedbacks.forEach(f => {
      if(f.emotion) {
        // We capitalize first letter for consistency
        const em = f.emotion.charAt(0).toUpperCase() + f.emotion.slice(1);
        emotionCounts[em] = (emotionCounts[em] || 0) + 1;
      }
    });
    
    const emotions = Object.entries(emotionCounts)
      .map(([label, count]) => ({ 
        label, 
        percent: Math.round((count / total) * 100) 
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 6);

    // Aggregate Aspects
    const aspectMap: Record<string, { total: number, count: number }> = {};
    
    feedbacks.forEach(f => {
      if(f.aspects) {
        f.aspects.forEach(a => {
           const name = a.name;
           if (!aspectMap[name]) aspectMap[name] = { total: 0, count: 0 };
           aspectMap[name].count++;
           if (a.sentiment === 'Positive') aspectMap[name].total += 100;
           else if (a.sentiment === 'Neutral') aspectMap[name].total += 50;
        });
      }
    });

    let aspectScores: any[] = [];
    if (Object.keys(aspectMap).length > 0) {
      aspectScores = Object.entries(aspectMap).map(([name, data]) => {
        const score = Math.round(data.total / data.count);
        let type = 'Neutral';
        if (score > 66) type = 'Positive';
        else if (score < 33) type = 'Negative';
        return { name, val: score, count: data.count, type: type as any };
      }).sort((a,b) => b.count - a.count).slice(0, 5);
    } else {
        // Default visualization if no aspect data exists yet
        aspectScores = [
            { name: 'Quality', val: 0, count: 0, type: 'Neutral' },
            { name: 'Service', val: 0, count: 0, type: 'Neutral' },
            { name: 'Experience', val: 0, count: 0, type: 'Neutral' }
        ];
    }

    // Locations
    const locations = feedbacks.filter(f => f.location).map(f => ({
        lat: f.location!.lat,
        lng: f.location!.lng,
        sentiment: f.sentimentLabel as Sentiment,
        name: f.locationName
    }));

    return {
      totalFeedbacks: total,
      positiveCount: pos,
      neutralCount: neu,
      negativeCount: neg,
      trendData,
      topKeywords,
      emotions,
      aspectScores,
      locations
    };
  }
}

export const dataService = new DataService();