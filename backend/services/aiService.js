import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

class MultiAIService {
  constructor() {
    this.providers = [];
    this.cohereCooldown = false;
    this.initializeProviders();
  }

  initializeProviders() {
    // Provider 1: Google Gemini
    if (process.env.GEMINI_API_KEY && 
        process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' &&
        process.env.GEMINI_API_KEY !== 'your_actual_gemini_key') {
      this.providers.push({
        name: 'gemini',
        client: new GoogleGenerativeAI(process.env.GEMINI_API_KEY),
        model: 'gemini-2.0-flash',
        generate: async (prompt, config = {}) => {
          try {
            const model = this.providers.find(p => p.name === 'gemini').client.getGenerativeModel({ 
              model: 'gemini-2.0-flash',
              generationConfig: {
                temperature: config.temperature || 0.2,
                maxOutputTokens: config.maxOutputTokens || 1024,
              }
            });
            const result = await model.generateContent(prompt);
            return result.response.text();
          } catch (error) {
            console.error(`Gemini error:`, error.message);
            throw error;
          }
        }
      });
    }

    // Provider 2: OpenAI
    if (process.env.OPENAI_API_KEY && 
        process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' &&
        process.env.OPENAI_API_KEY !== 'your_actual_openai_key') {
      this.providers.push({
        name: 'openai',
        client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        generate: async (prompt, config = {}) => {
          try {
            const completion = await this.providers.find(p => p.name === 'openai').client.chat.completions.create({
              model: this.providers.find(p => p.name === 'openai').model,
              messages: [{ role: 'user', content: prompt }],
              temperature: config.temperature || 0.2,
              max_tokens: config.maxOutputTokens || 1024,
            });
            return completion.choices[0].message.content;
          } catch (error) {
            console.error(`OpenAI error:`, error.message);
            throw error;
          }
        }
      });
    }

    // Provider 3: Groq (OpenAI-compatible endpoint)
    // Docs: https://console.groq.com/docs/openai
    if (process.env.GROQ_API_KEY &&
        process.env.GROQ_API_KEY !== 'your_groq_api_key_here' &&
        process.env.GROQ_API_KEY !== 'your_actual_groq_key') {
      this.providers.push({
        name: 'groq',
        client: null,
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        generate: async (prompt, config = {}) => {
          try {
            const response = await axios.post(
              'https://api.groq.com/openai/v1/chat/completions',
              {
                model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: prompt }],
                temperature: config.temperature || 0.2,
                max_tokens: config.maxOutputTokens || 1024,
              },
              {
                headers: {
                  'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                  'Content-Type': 'application/json'
                },
                timeout: 30000
              }
            );
            return response.data?.choices?.[0]?.message?.content;
          } catch (error) {
            const status = error.response?.status;
            const msg = status ? `${status} ${error.message}` : error.message;
            console.error('Groq error:', msg);
            throw error;
          }
        }
      });
    }

    // Provider 4: Anthropic Claude
    if (process.env.ANTHROPIC_API_KEY && 
        process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here' &&
        process.env.ANTHROPIC_API_KEY !== 'your_actual_anthropic_key') {
      this.providers.push({
        name: 'anthropic',
        client: new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
        model: 'claude-3-haiku-20240307',
        generate: async (prompt, config = {}) => {
          try {
            const message = await this.providers.find(p => p.name === 'anthropic').client.messages.create({
              model: 'claude-3-haiku-20240307',
              max_tokens: config.maxOutputTokens || 1024,
              temperature: config.temperature || 0.2,
              messages: [{ role: 'user', content: prompt }]
            });
            return message.content[0].text;
          } catch (error) {
            console.error(`Anthropic error:`, error.message);
            throw error;
          }
        }
      });
    }

    // Provider 5: Cohere (with rate limit handling)
    if (process.env.COHERE_API_KEY && 
        process.env.COHERE_API_KEY !== 'your_cohere_api_key_here') {
      this.providers.push({
        name: 'cohere',
        client: null,
        model: 'command',
        generate: async (prompt, config = {}) => {
          try {
            // Add delay to respect rate limits
            await this.delay(2000);
            
            // Check if in cooldown
            if (this.cohereCooldown) {
              throw new Error('Cohere rate limit cooldown active');
            }
            
            const response = await axios.post(
              'https://api.cohere.ai/v1/generate',
              {
                model: 'command',
                prompt: prompt,
                max_tokens: Math.min(config.maxOutputTokens || 500, 500),
                temperature: config.temperature || 0.2,
              },
              {
                headers: {
                  'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
                  'Content-Type': 'application/json'
                },
                timeout: 30000
              }
            );
            
            // Reset cooldown on success
            this.cohereCooldown = false;
            return response.data.generations[0].text;
          } catch (error) {
            // Set cooldown on rate limit
            if (error.response?.status === 429) {
              console.log('Cohere rate limit hit, entering cooldown');
              this.cohereCooldown = true;
              // Reset cooldown after 60 seconds
              setTimeout(() => {
                this.cohereCooldown = false;
              }, 60000);
            }
            console.error('Cohere error:', error.message);
            throw error;
          }
        }
      });
    }

    // Provider 6: Grok (xAI)
    if (process.env.XAI_API_KEY && 
        process.env.XAI_API_KEY !== 'your_xai_api_key_here' &&
        process.env.XAI_API_KEY !== 'your_actual_xai_key') {
      this.providers.push({
        name: 'grok',
        client: null,
        model: 'grok-beta',
        generate: async (prompt, config = {}) => {
          try {
            const response = await axios.post(
              'https://api.x.ai/v1/chat/completions',
              {
                model: 'grok-beta',
                messages: [{ role: 'user', content: prompt }],
                temperature: config.temperature || 0.2,
                max_tokens: config.maxOutputTokens || 1024,
              },
              {
                headers: {
                  'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
                  'Content-Type': 'application/json'
                },
                timeout: 30000
              }
            );
            return response.data.choices[0].message.content;
          } catch (error) {
            console.error(`Grok error:`, error.message);
            throw error;
          }
        }
      });
    }

    // Provider 7: DeepSeek
    if (process.env.DEEPSEEK_API_KEY && 
        process.env.DEEPSEEK_API_KEY !== 'your_deepseek_api_key_here' &&
        process.env.DEEPSEEK_API_KEY !== 'your_actual_deepseek_key') {
      this.providers.push({
        name: 'deepseek',
        client: null,
        model: 'deepseek-chat',
        generate: async (prompt, config = {}) => {
          try {
            const response = await axios.post(
              'https://api.deepseek.com/v1/chat/completions',
              {
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
                temperature: config.temperature || 0.2,
                max_tokens: config.maxOutputTokens || 1024,
              },
              {
                headers: {
                  'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                  'Content-Type': 'application/json'
                },
                timeout: 30000
              }
            );
            return response.data.choices[0].message.content;
          } catch (error) {
            console.error(`DeepSeek error:`, error.message);
            throw error;
          }
        }
      });
    }

    // Provider 8: Mock (always available as fallback)
    this.providers.push({
      name: 'mock',
      client: null,
      model: 'mock',
      generate: async (prompt, config = {}) => {
        if (!this._mockLogged) {
          console.log('📝 Using mock AI provider - all other providers unavailable or rate limited');
          this._mockLogged = true;
        }
        return this.generateMockResponse(prompt);
      }
    });
  }

  generateMockResponse(prompt) {
    // Smart mock responses based on prompt content
    if (prompt.includes('wastePrediction') || prompt.includes('waste analysis')) {
      return JSON.stringify({
        wastePrediction: [
          { item: "Fresh Vegetables", suggestedPrep: "Reduce by 20%", reason: "Low demand pattern detected" },
          { item: "Dairy Products", suggestedPrep: "Use within 2 days", reason: "Nearing expiry date" },
          { item: "Protein Items", suggestedPrep: "Prepare 70% of usual", reason: "Historical waste rate 25%" }
        ],
        doNotMake: [
          { item: "Specialty items", reason: "Low sales volume" },
          { item: "Large batches", reason: "Risk of spoilage" }
        ],
        generalTips: [
          "Track daily sales to identify patterns",
          "Implement FIFO inventory system",
          "Train staff on portion control",
          "Consider daily specials for expiring ingredients"
        ]
      });
    } 
    else if (prompt.includes('totalSales') || prompt.includes('profit') || prompt.includes('salesprofit')) {
      return JSON.stringify({
        totalSales: "₹12,500",
        profit: "₹3,125",
        tip: "Focus on high-margin items like beverages and desserts. Consider dynamic pricing during peak hours. Reduce food waste by tracking inventory more closely."
      });
    } 
    else if (prompt.includes('slowestHours') || prompt.includes('slowhour')) {
      return JSON.stringify({
        slowestHours: ["2:00 PM - 4:00 PM"],
        suggestions: ["Offer happy hour discounts", "Create combo deals", "Promote beverages"]
      });
    } 
    else if (prompt.includes('recipe') || prompt.includes('leftover')) {
      return JSON.stringify([
        { recipe: "Vegetable Stir Fry", profit: "₹150", demand: 7 },
        { recipe: "Soup of the Day", profit: "₹120", demand: 8 },
        { recipe: "Fritters", profit: "₹180", demand: 6 }
      ]);
    } 
    else if (prompt.includes('schedule') || prompt.includes('shifts')) {
      return JSON.stringify({
        shifts: [
          { staffId: "staff1", staffName: "Morning Team", role: "waiter", shiftTime: "9:00 AM - 5:00 PM", date: new Date().toISOString().split('T')[0] },
          { staffId: "staff2", staffName: "Evening Team", role: "waiter", shiftTime: "4:00 PM - 12:00 AM", date: new Date().toISOString().split('T')[0] }
        ],
        summary: {
          totalShifts: 2,
          staffNeeded: 4,
          recommendations: ["Add more staff during peak hours", "Cross-train team members", "Consider split shifts"]
        }
      });
    }
    else if (prompt.includes('upsell')) {
      return JSON.stringify([
        { message: "Suggest premium desserts with main courses", category: "recommendation", confidence: 0.85, ingredient: "Desserts" },
        { message: "Offer craft beverages with lunch specials", category: "upsell", confidence: 0.78, ingredient: "Beverages" },
        { message: "Recommend appetizer combos for table orders", category: "upsell", confidence: 0.92, ingredient: "Appetizers" }
      ]);
    }
    else if (prompt.includes('alert') || prompt.includes('inventory')) {
      return JSON.stringify([
        { message: "Monitor vegetable stock - low quantities detected", category: "waste risk", confidence: 0.8, ingredient: "Vegetables" },
        { message: "Dairy products nearing expiry in 2 days", category: "waste risk", confidence: 0.9, ingredient: "Milk, Cheese" },
        { message: "Consider reducing prep for low-demand items", category: "recommendation", confidence: 0.7, ingredient: "Specialty items" }
      ]);
    }
    else {
      return JSON.stringify({ 
        message: "AI service temporarily unavailable. Using intelligent fallback responses.",
        data: "Your request has been processed with best-practice recommendations."
      });
    }
  }

  async generateJSON(prompt, config = {}) {
    const errors = [];
    
    for (const provider of this.providers) {
      try {
        if (provider.name !== 'mock') {
          console.log(`🤖 Trying provider: ${provider.name}`);
        }
        
        const response = await provider.generate(prompt, config);
        
        // Clean and parse JSON
        let cleaned = response.trim();
        cleaned = cleaned.replace(/```json|```/g, '').trim();
        
        // Try to extract JSON if there's extra text
        const jsonMatch = cleaned.match(/(\[|\{)[\s\S]*(\]|\})/);
        if (jsonMatch) {
          cleaned = jsonMatch[0];
        }
        
        const parsed = JSON.parse(cleaned);
        
        if (provider.name !== 'mock') {
          console.log(`✅ Success with provider: ${provider.name}`);
        }
        
        return parsed;
      } catch (error) {
        if (provider.name !== 'mock') {
          console.log(`❌ Provider ${provider.name} failed: ${error.message}`);
        }
        errors.push({ provider: provider.name, error: error.message });
        
        // If it's a rate limit error, wait a bit before next attempt
        if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('rate limit')) {
          await this.delay(3000);
        }
        continue;
      }
    }
    
    // If we get here, all providers failed - use mock
    console.log('📊 All providers failed, using mock AI provider for response');
    const mockResponse = this.generateMockResponse(prompt);
    return JSON.parse(mockResponse);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const aiService = new MultiAIService();
export default aiService;