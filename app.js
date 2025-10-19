import express from "express";
import path from "path";
import { title } from "process";
import { fileURLToPath } from "url";
import { compareCode } from "./code-comparator.js";
import Groq from "groq-sdk";
import convertText_prompt from "./scrapingwithprompt_script.js";
import "dotenv/config";
import scrapeUrl from "./scrapewords_puppeteer.js";

const groq = new Groq({
  apiKey: process.env.API_KEY, // Put your key in your .env file
});
// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(path.join(process.cwd(), "public")));
// Set EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.get("/", (req, res) => {
  res.render("index");
});
// 1. GET Route: Render the main page
app.get("/detector", (re1, res) => {
  res.render("AIcodedetection/Detector");
});
app.get("/prompt", (re1, res) => {
  res.render("prompts/prompt");
});
app.get("/urlscrape", (re1, res) => {
  res.render("Url_Scrap/urlScarping");
});
// This is the route handler that was missing
app.use(express.json());
app.post("/scrapePrompt", async (req, res) => {
  const { prompt } = req.body;

  console.log("Received prompt:", prompt); // Debugging log

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const output = await convertText_prompt(prompt); // Use convertText_prompt here
    console.log("Scraped Output:", output); // Debugging log
    res.json({ output }); // Send the results back to the frontend
  } catch (error) {
    console.error("Error processing prompt:", error.message);
    res.status(500).json({ error: "Failed to process the prompt" });
  }
});
app.post("/scrapeUrl", async (req, res) => {
  // req.body will contain { targetUrl, searchDepth, isEcommerce }
  console.log("Server: Received /scrapeUrl request for:", req.body.targetUrl);

  if (!req.body.targetUrl) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    // Pass the entire req.body object to the scraper
    const output = await scrapeUrl(req.body);
    res.json({ output }); // Send the results back
  } catch (error) {
    console.error("Error processing URL scrape:", error.message);
    res.status(500).json({ error: "Failed to process the URL" });
  }
});

// 2. POST Route: The API for comparing code
// --- (Keep this function, but we won't use it directly from the frontend) ---
app.post("/compare-internal", (req, res) => {
  const { code1, code2 } = req.body;
  const result = compareCode(code1, code2);
  res.json(result);
});
async function getScrapedWebSources(query) {
  console.log(`Simulating scraping the web for: "${query}"`);

  // We return a Promise to act like a real network request
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          source: "https://stackoverflow.com/questions/12345",
          code: `
            // This code is a 100% match, just with different names
            function calculateTotal(items) {
              let total = 0;
              for (let i = 0; i < items.length; i++) {
                total = total + items[i].price;
              }
              return total;
            }
          `,
        },
        {
          source: "https://github.com/some-repo/utils.js",
          code: `
            // This is a different function
            function getUser(id) {
              return database.find(user => user.id === id);
            }
          `,
        },
        {
          source: "https://gist.github.com/user123/abc",
          code: `
            // This is also a close match (structural loop)
            var sum = 0;
            for(var x = 0; x < priceList.length; x++) {
              sum += priceList[x];
            }
            console.log(sum);
          `,
        },
      ]);
    }, 1000); // Simulate a 1-second network delay
  });
}
app.post("/check-ai-code", async (req, res) => {
  const { suspectCode } = req.body;

  if (!suspectCode) {
    return res.status(400).json({ error: "Code snippet is required." });
  }

  // This is the "brain" of our project.
  // We are asking the AI to be our detector.
  const prompt = `
    You are a world-class code reviewer and AI detector. Analyze the following code snippet.
    
    Look for specific "fingerprints" of AI-generated code, such as:
    1.  Overly generic or verbose comments (e.g., "// Function to add two numbers").
    2.  "Sterile" or "perfect" formatting.
    3.  Repetitive or uncreative variable names (e.g., 'data', 'result', 'item').
    4.  Lack of error handling for common edge cases (e.g., null inputs, empty arrays).
    5.  Use of common boilerplate patterns without clever or human-like customization.
    
    Based on your analysis, provide a JSON response with two keys:
    1.  "score": An integer from 0 (Definitely Human) to 100 (Definitely AI).
    2.  "reason": A one-sentence explanation for your score.
    
    Code to analyze:
    """
    ${suspectCode}
    """
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      // model: "llama3-8b-8192", // Use a fast and smart model
      // model: "llama-3.1-8b-instant",
      model:"openai/gpt-oss-20b",

      temperature: 0.2,
      response_format: { type: "json_object" }, // Force JSON output!
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content;

    // Parse the JSON string from the AI and send it to the frontend
    res.json(JSON.parse(aiResponse));
  } catch (error) {
    console.error("Groq API Error:", error);
    res.status(500).json({ error: "Failed to contact AI model." });
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
