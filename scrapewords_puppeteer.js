import puppeteer from "puppeteer";
import { OpenAI } from "openai";
import { fileURLToPath } from "url";
import { basename } from "path";
import dotenv from "dotenv";
dotenv.config();

console.log("API Key Loaded:", process.env.API_KEY); // Debug only
const openai = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
});

// 1. MODIFIED to accept an object with all form data
async function scrapeWebsite({ targetUrl, searchDepth, isEcommerce }) {
  if (!targetUrl) {
    throw new Error("URL is required");
  }

  console.log("Backend Scraper: Received job for:", targetUrl);
  console.log("Backend Scraper: Depth:", searchDepth, "Is Ecom:", isEcommerce);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36');

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle2' });

    const pageText = await page.evaluate(() => {
      return document.body.innerText;
    });

    // 2. Use searchDepth to determine how much text to analyze
    // Maps 0-100 slider to 500-8000 words
    const wordCount = 500 + (parseInt(searchDepth, 10) * 75);
    console.log(`Backend Scraper: Analyzing ${wordCount} words based on depth.`);
    
    const words = pageText.match(/\b\w+\b/g) || [];
    const textChunk = words.slice(0, wordCount).join(' ');

    // 3. Pass all data to the summarizer
    const summarizedText = await summarizeText({
      text: textChunk,
      isEcommerce: isEcommerce,
      searchDepth: searchDepth
    });

    await browser.close();
    return summarizedText;

  } catch (err) {
    await browser.close();
    throw new Error(`Error scraping website: ${err.message}`);
  }
}

// 4. MODIFIED to use all data for a smarter summary
async function summarizeText({ text, isEcommerce, searchDepth }) {
  // Create a dynamic system prompt
  let systemPrompt = "You are a helpful assistant that summarizes website content.\n";
  if (isEcommerce) {
    systemPrompt += "This is an E-COMMERCE site. Focus on product names, prices (in ₹), key features, and user sentiment/reviews. List items clearly.";
  } else {
    systemPrompt += "This is a general content site (blog, news, etc.). Focus on the main ideas, key arguments, and conclusions.";
  }

  // Use searchDepth to control summary length (max_tokens)
  // Maps 0-100 slider to 150-600 tokens
  const maxTokens = Math.floor(150 + (parseInt(searchDepth, 10) * 4.5));
  console.log(`Backend Scraper: Setting max_tokens to ${maxTokens}`);

  try {
    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please summarize the following text. Extract the key information accurately.\n\n${text}` }
      ],
      temperature: 0.5, // Lowered temp for more factual summary
      max_tokens: maxTokens
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    throw new Error(`Error summarizing text: ${err.message}`);
  }
}

// 5. COMMENT OUT the old command-line test block
/*
const currentFile = basename(fileURLToPath(import.meta.url));

if (process.argv[1].endsWith(currentFile)) {
  const url = process.argv[2];

  scrapeWebsite({ targetUrl: url, searchDepth: "50", isEcommerce: false })
    .then(data => {
      console.log("Summarized text:\n", data);
    })
    .catch(err => {
      console.error("Error:", err.message);
    });
}
*/

// 6. ADD the default export
export default scrapeWebsite;