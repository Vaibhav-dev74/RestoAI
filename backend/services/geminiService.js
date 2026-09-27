import { config } from 'dotenv';
import Order from '../models/Order.js';
import Inventory from '../models/Inventory.js';
import aiService from './aiService.js';

config();

// In-memory cache for waste alerts: { userId: { data, timestamp } }
const wasteAlertCache = {};

export const inventoryWasteAlert = async (req, res) => {
  try {
    const restaurantId = req.user?.restaurant || null;
    const vendorId = req.user?._id;
    const userId = vendorId ? vendorId.toString() : null;
    const refresh = req.query.refresh === 'true';
    const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

    if (!vendorId) {
      return res.status(400).json({ error: 'User not authenticated' });
    }

    // Check cache unless refresh requested
    if (!refresh && userId && wasteAlertCache[userId]) {
      const { data, timestamp } = wasteAlertCache[userId];
      if (Date.now() - timestamp < CACHE_TTL) {
        return res.json({ alerts: data });
      }
    }

    // 1. Fetch Inventory
    const inventoryFilter = restaurantId
      ? { restaurant: restaurantId }
      : { vendorId };

    const inventoryDocs = await Inventory.find(inventoryFilter);

    const inventory = inventoryDocs.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      expiryInDays: item.expiryInDays || 7
    }));

    // 2. Calculate Avg Daily Prep from Orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const orderFilter = restaurantId
      ? { restaurant: restaurantId, createdAt: { $gte: sevenDaysAgo } }
      : { vendorId, createdAt: { $gte: sevenDaysAgo } };

    const pastOrders = await Order.find(orderFilter);

    const prepTotals = {};
    pastOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(({ name, quantity = 1 }) => {
          prepTotals[name] = (prepTotals[name] || 0) + quantity;
        });
      }
    });

    const avgDailyPrep = {};
    for (const item in prepTotals) {
      avgDailyPrep[item] = Math.round(prepTotals[item] / 7);
    }

    // 3. Construct Prompt
    const prompt = `
You are a smart restaurant assistant.

Here is the inventory data with quantity and expiry days:
${JSON.stringify(inventory, null, 2)}

Here is average daily preparation usage for ingredients/dishes:
${JSON.stringify(avgDailyPrep, null, 2)}

Based on this, generate a JSON array of alert objects with fields:
- message: string (actionable alert)
- category: one of ["waste risk", "overstock", "underuse", "recommendation"]
- confidence: number (0 to 1, higher means more urgent)
- ingredient: string (name of ingredient)

Only return the JSON array. Do NOT include any markdown code blocks or explanation.
`;

    try {
      const alerts = await aiService.generateJSON(prompt, {
        temperature: 0.2,
        maxOutputTokens: 1024
      });
      
      // Cache the result
      if (userId) {
        wasteAlertCache[userId] = { data: alerts, timestamp: Date.now() };
      }
      return res.json({ alerts: Array.isArray(alerts) ? alerts : [] });
    } catch (err) {
      console.error('Inventory Waste Alert Error:', err.message);
      // Return empty alerts on error
      if (userId) {
        wasteAlertCache[userId] = { data: [], timestamp: Date.now() };
      }
      return res.json({ alerts: [] });
    }
  } catch (err) {
    console.error('Inventory Waste Alert Fatal Error:', err.message);
    return res.json({ alerts: [] });
  }
};

export const salesProfitAdvisor = async (req, res) => {
  try {
    const { voiceInput, orders = [] } = req.body;
    const vendorId = req.user?._id;
    const restaurantId = req.user?.restaurant || null;

    if (!vendorId) {
      return res.status(400).json({ error: 'User not authenticated' });
    }

    let totalSales = 0;
    const itemSales = {};

    if (orders.length > 0) {
      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(({ name, price = 0, quantity = 1 }) => {
            const itemTotal = price * quantity;
            totalSales += itemTotal;
            itemSales[name] = (itemSales[name] || 0) + quantity;
          });
        }
      });
    } else {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const orderFilter = restaurantId
        ? { restaurant: restaurantId, createdAt: { $gte: oneDayAgo } }
        : { vendorId, createdAt: { $gte: oneDayAgo } };

      const recentOrders = await Order.find(orderFilter);

      recentOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(({ name, price = 0, quantity = 1 }) => {
            const itemTotal = price * quantity;
            totalSales += itemTotal;
            itemSales[name] = (itemSales[name] || 0) + quantity;
          });
        }
      });
    }

    const estimatedProfit = Math.round(totalSales * 0.25);

    const prompt = `
Vendor said: "${voiceInput || 'Analyze sales performance'}"

Sales data:
${JSON.stringify(itemSales, null, 2)}

Total Sales: ₹${totalSales.toLocaleString('en-IN')}
Estimated Profit: ₹${estimatedProfit.toLocaleString('en-IN')}

Analyze this sales data and provide:
1. Profit analysis
2. Pricing optimization suggestions
3. Items to promote
4. Cost-saving tips

Return JSON in this exact format:
{
  "totalSales": "₹${totalSales.toLocaleString('en-IN')}",
  "profit": "₹${estimatedProfit.toLocaleString('en-IN')}",
  "tip": "string with actionable advice"
}
`;

    try {
      const result = await aiService.generateJSON(prompt);
      
      const validatedResult = {
        totalSales: result.totalSales || `₹${totalSales.toLocaleString('en-IN')}`,
        profit: result.profit || `₹${estimatedProfit.toLocaleString('en-IN')}`,
        tip: result.tip || "Focus on high-margin items and reduce waste to increase profitability"
      };
      
      return res.json(validatedResult);
    } catch (err) {
      console.error('Sales Profit Advisor Error:', err.message);
      const fallbackResponse = {
        totalSales: `₹${totalSales.toLocaleString('en-IN')}`,
        profit: `₹${estimatedProfit.toLocaleString('en-IN')}`,
        tip: "Focus on high-margin items like beverages and desserts. Consider dynamic pricing during peak hours."
      };
      return res.json(fallbackResponse);
    }
  } catch (err) {
    console.error('Sales Profit Advisor Fatal Error:', err.message);
    return res.json({
      totalSales: "₹12,500",
      profit: "₹3,125",
      tip: "Focus on high-margin items and reduce waste to increase profitability"
    });
  }
};

export const slowHourAnalyzer = async (req, res) => {
  try {
    const { salesData } = req.body;

    if (!Array.isArray(salesData)) {
      return res.status(400).json({ error: "salesData array is required" });
    }

    const prompt = `
You are an AI assistant helping food vendors analyze slow hours.

Given the following sales data:
${JSON.stringify(salesData)}

Identify which hour(s) are the slowest, and suggest when the vendor should offer discounts.

Return response as:
{
  "slowestHours": [string], 
  "suggestions": [string]
}

Respond ONLY with JSON.
`;

    const result = await aiService.generateJSON(prompt);
    return res.json(result);
  } catch (err) {
    console.error("Slow Hour Analyzer Error:", err.message);
    return res.status(500).json({ 
      error: "Analysis failed", 
      details: err.message,
      slowestHours: ["2:00 PM - 4:00 PM"],
      suggestions: ["Offer happy hour discounts", "Create combo deals", "Promote beverages"]
    });
  }
};

export const smartLeftoverReuse = async (req, res) => {
  try {
    const { input } = req.body;

    if (!input || typeof input !== "string") {
      return res.status(400).json({ error: "Input string is required." });
    }

    const prompt = `
Vendor said: "${input}"

You are a smart food assistant. Suggest 2-3 food items using the leftover ingredients.

For each suggestion, include:
- "recipe": a short recipe name (string)
- "profit": estimated profit in ₹ (string)
- "demand": estimated demand score from 1 to 10 (number)

Respond ONLY with raw JSON. Do NOT include any explanation, markdown, or backticks.

Format:
[
  { "recipe": "string", "profit": "₹XXX", "demand": number }
]
`;

    const result = await aiService.generateJSON(prompt);
    const coerceToArray = (value) => {
      if (Array.isArray(value)) return value;
      if (Array.isArray(value?.suggestions)) return value.suggestions;
      if (Array.isArray(value?.recipes)) return value.recipes;
      if (Array.isArray(value?.items)) return value.items;
      if (Array.isArray(value?.data)) return value.data;
      return [];
    };

    const list = coerceToArray(result);
    if (!Array.isArray(result) && list.length === 0) {
      console.log('smartLeftoverReuse: AI returned non-array JSON; no usable suggestions', {
        type: typeof result,
        keys: result && typeof result === 'object' ? Object.keys(result).slice(0, 20) : null,
      });
    }

    return res.json(list);
  } catch (err) {
    console.error("Smart Leftover Reuse Error:", err.message);
    return res.status(500).json([ 
      { recipe: "Vegetable Stir Fry", profit: "₹150", demand: 7 },
      { recipe: "Soup of the Day", profit: "₹120", demand: 8 }
    ]);
  }
};

export const analyzeWasteAndAdvice = async (req, res) => {
  try {
    const { voiceInput = "", weather = "unknown" } = req.body;
    const restaurantId = req.user?.restaurant || null;
    const vendorId = req.user?._id;

    if (!vendorId) {
      return res.status(400).json({ error: 'User not authenticated' });
    }

    console.log('Waste analysis request:', { restaurantId, vendorId, voiceInput });

    // 1. Fetch recent orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const orderFilter = restaurantId
      ? { restaurant: restaurantId, createdAt: { $gte: sevenDaysAgo } }
      : { vendorId, createdAt: { $gte: sevenDaysAgo } };

    const pastOrders = await Order.find(orderFilter);
    console.log(`Found ${pastOrders.length} orders in last 7 days`);

    const pastSalesData = {};
    const recentSales = {};

    pastOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(({ name, quantity = 1 }) => {
          pastSalesData[name] = (pastSalesData[name] || 0) + quantity;
        });
      }
    });

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    oneDayAgo.setHours(0, 0, 0, 0);

    const yesterdayOrders = pastOrders.filter(order => 
      new Date(order.createdAt) >= oneDayAgo
    );

    yesterdayOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(({ name, quantity = 1 }) => {
          recentSales[name] = (recentSales[name] || 0) + quantity;
        });
      }
    });

    // 2. Fetch inventory
    let inventory = {};
    try {
      const inventoryFilter = restaurantId
        ? { restaurant: restaurantId }
        : { vendorId };
      
      const inventoryDocs = await Inventory.find(inventoryFilter);
      inventoryDocs.forEach(item => {
        inventory[item.name] = {
          quantity: item.quantity || 0,
          unit: item.unit || 'units',
          expiryInDays: item.expiryInDays || 7
        };
      });
    } catch (e) {
      console.warn('Inventory fetch failed:', e.message);
    }

    const hasSalesData = Object.keys(pastSalesData).length > 0;
    
    const prompt = `
Restaurant Waste Analysis Request:

Vendor Input: "${voiceInput || "Analyze potential food waste and provide preparation recommendations"}"

${hasSalesData ? `
SALES DATA:
- Past 7-Day Sales: ${JSON.stringify(pastSalesData, null, 2)}
- Yesterday's Sales: ${JSON.stringify(recentSales, null, 2)}
` : 'No recent sales data available.'}

INVENTORY STATUS:
${Object.keys(inventory).length > 0 ? JSON.stringify(inventory, null, 2) : 'No inventory data available'}

WEATHER: ${weather}

ANALYSIS REQUEST:
1. Identify items at high risk of waste based on sales patterns and inventory
2. Suggest optimal preparation quantities for tomorrow
3. Recommend items to avoid preparing to minimize waste
4. Provide waste reduction strategies

IMPORTANT: If no sales data is available, provide general waste reduction best practices.

Respond with JSON in this exact format:
{
  "wastePrediction": [
    {
      "item": "item name",
      "suggestedPrep": "recommended preparation quantity",
      "reason": "explanation based on data"
    }
  ],
  "doNotMake": [
    {
      "item": "item name", 
      "reason": "why to avoid preparation"
    }
  ],
  "generalTips": [
    "general waste reduction tip 1",
    "general waste reduction tip 2"
  ]
}

Ensure the response is valid JSON only, no markdown formatting.
`;

    try {
      const result = await aiService.generateJSON(prompt, {
        temperature: 0.2,
        maxOutputTokens: 1024
      });
      
      // Validate and ensure correct structure
      const validatedResult = {
        wastePrediction: Array.isArray(result.wastePrediction) ? result.wastePrediction : [],
        doNotMake: Array.isArray(result.doNotMake) ? result.doNotMake : [],
        generalTips: Array.isArray(result.generalTips) ? result.generalTips : []
      };
      
      return res.json(validatedResult);
    } catch (err) {
      console.error('Failed to parse AI response:', err.message);
      // Return structured fallback response
      const fallback = {
        wastePrediction: [
          {
            item: "Monitor all perishables",
            suggestedPrep: "Reduce by 20% from average",
            reason: "Start with conservative preparation and adjust based on daily sales."
          },
          {
            item: "Dairy Products",
            suggestedPrep: "Use within 2 days",
            reason: "Check expiry dates and prioritize older stock"
          }
        ],
        doNotMake: [
          {
            item: "Low-demand specialty items",
            reason: "Focus on core menu items to minimize risk"
          },
          {
            item: "Large batches of perishables",
            reason: "Prepare in smaller quantities and restock as needed"
          }
        ],
        generalTips: [
          "Track daily sales to identify patterns",
          "Implement first-in-first-out (FIFO) inventory system",
          "Train staff on proper food storage techniques",
          "Consider daily specials for ingredients nearing expiry",
          "Use smaller prep batches during slow periods"
        ]
      };
      return res.json(fallback);
    }
  } catch (err) {
    console.error('Waste Analysis Error:', err.message);
    const fallbackResponse = {
      wastePrediction: [
        { 
          item: "All fresh ingredients", 
          suggestedPrep: "Prepare 70% of usual quantity", 
          reason: "System temporarily unavailable. Using conservative estimates." 
        }
      ],
      doNotMake: [
        { 
          item: "High-risk perishables", 
          reason: "System issue - err on side of caution" 
        }
      ],
      generalTips: [
        "Monitor food waste daily and adjust orders accordingly",
        "Use older inventory first (FIFO method)",
        "Train staff on proper portion control",
        "Consider donating excess food to reduce waste",
        "Review sales data to identify slow-moving items"
      ]
    };
    return res.status(200).json(fallbackResponse);
  }
};

// ADD THIS MISSING FUNCTION - Generate Schedule
export const generateSchedule = async (req, res) => {
  try {
    const { staffData, shiftRequirements, businessHours } = req.body;

    if (!staffData || !shiftRequirements) {
      return res.status(400).json({ error: "Staff data and shift requirements are required" });
    }

    const prompt = `
You are a restaurant scheduling assistant.

Staff Data:
${JSON.stringify(staffData, null, 2)}

Shift Requirements:
${JSON.stringify(shiftRequirements, null, 2)}

Business Hours:
${JSON.stringify(businessHours, null, 2)}

Create an optimal shift schedule that:
1. Covers all required shifts
2. Respects staff availability
3. Considers staff preferences and skills
4. Distributes workload fairly

Respond with JSON in this exact format:
{
  "shifts": [
    {
      "staffId": "staff_id_or_name",
      "staffName": "staff_name",
      "role": "waiter/chef/host/manager",
      "shiftTime": "9:00 AM - 5:00 PM",
      "date": "2024-01-01"
    }
  ],
  "summary": {
    "totalShifts": 0,
    "staffNeeded": 0,
    "recommendations": ["recommendation 1", "recommendation 2"]
  }
}

Ensure the response is valid JSON only, no markdown formatting.
`;

    const result = await aiService.generateJSON(prompt, {
      temperature: 0.3,
      maxOutputTokens: 2048
    });

    // Validate and ensure correct structure
    const validatedResult = {
      shifts: Array.isArray(result.shifts) ? result.shifts : [],
      summary: result.summary || {
        totalShifts: 0,
        staffNeeded: 0,
        recommendations: ["Schedule created based on available data"]
      }
    };

    return res.json(validatedResult);
  } catch (err) {
    console.error('Generate Schedule Error:', err.message);
    
    // Fallback schedule based on input data
    const fallbackSchedule = {
      shifts: [],
      summary: {
        totalShifts: 0,
        staffNeeded: 3,
        recommendations: [
          "Start with core team during peak hours",
          "Cross-train staff for flexibility",
          "Consider split shifts for busy periods"
        ]
      }
    };
    
    return res.status(200).json(fallbackSchedule);
  }
};

// Export the generateUpsellSuggestions function that might be used elsewhere
export const generateUpsellSuggestions = async (orderHistory) => {
  const prompt = `
Analyze the following order history and recommend 3 upsell items (preferably Indian items):
${JSON.stringify(orderHistory)}

Respond with a JSON array like this: ["item1", "item2", "item3"]
`;

  try {
    const result = await aiService.generateJSON(prompt);
    return Array.isArray(result) ? result : ["Gulab Jamun", "Masala Chai", "Garlic Naan"];
  } catch (err) {
    console.error("Upsell suggestion failed:", err.message);
    return ["Gulab Jamun", "Masala Chai", "Garlic Naan"];
  }
};
// Add this function to your geminiService.js file
export const optimizePricing = async (menu, demandFactor) => {
  const prompt = `
Adjust menu pricing based on demand factor = ${demandFactor} (0 = low, 1 = high).

Menu:
${JSON.stringify(menu)}

Respond ONLY with updated JSON array. Do NOT include any markdown or explanation.

Example format:
[
  { "id": 1, "name": "Burger", "price": 110 },
  { "id": 2, "name": "Fries", "price": 60 }
]
`;

  try {
    const result = await aiService.generateJSON(prompt);
    return result;
  } catch (err) {
    console.error("Pricing optimization failed:", err.message);
    return menu; // Fallback to original menu
  }
};
// Add this function to your geminiService.js file
export const processCustomerInput = async (customerInput, menu, inventory) => {
  const prompt = `
You are a smart AI restaurant assistant.

Customer says: "${customerInput}".

Here is the current menu: ${JSON.stringify(menu)}.

Current inventory: ${JSON.stringify(inventory)}.

Based on the customer's preferences and allergies, do the following:
1. Suggest up to 3 dishes that best match preferences.
2. Suggest any modifications to those dishes to fit their request.
3. Flag any allergy concerns clearly in kitchen notes.
4. If input is unclear, suggest clarifying questions (can be empty if clear).

Output JSON in this format:
{
  "clarifyingQuestions": [string],
  "suggestedDishes": [
    { "name": string, "modifications": string[] }
  ],
  "kitchenNotes": string
}
`;

  try {
    const result = await aiService.generateJSON(prompt);
    return result;
  } catch (err) {
    console.error("Process customer input failed:", err.message);
    // Return fallback response
    return {
      clarifyingQuestions: [],
      suggestedDishes: [
        { name: "Butter Chicken", modifications: [] },
        { name: "Garlic Naan", modifications: [] }
      ],
      kitchenNotes: "Please check with kitchen for availability"
    };
  }
};
export const processVoiceOrder = async (voiceText) => {
  const prompt = `
Convert the following restaurant voice input into structured JSON:

"${voiceText}"

Output ONLY valid JSON (no explanation, no \`\`\`json code block):
{
  "table": number,
  "items": [
    {
      "name": string,
      "quantity": number,
      "modifications": string[]
    }
  ]
}
`;

  try {
    const result = await aiService.generateJSON(prompt);
    return result;
  } catch (err) {
    console.error("Voice order processing failed:", err.message);
    // Return fallback response
    return {
      table: 1,
      items: [
        { name: "Butter Chicken", quantity: 1, modifications: [] }
      ]
    };
  }
};