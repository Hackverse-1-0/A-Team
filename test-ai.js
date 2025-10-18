// test-ai.js
import 'dotenv/config'; // ★ Make sure this is at the VERY TOP
import Groq from 'groq-sdk';

const groq = new Groq(); // This will find your API key in .env

// --- Test Case 1: AI-Generated Style ---
// Very clean, perfect comments, generic variable names.
const AI_CODE_SAMPLE = `
// Function to fetch data from a given URL
async function fetchData(url) {
  try {
    // Await the response from the fetch call
    const response = await fetch(url);
    
    // Check if the response is ok (status code 200-299)
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    // Parse the JSON data from the response
    const data = await response.json();
    
    // Return the parsed data
    return data;
  } catch (error) {
    // Log any errors to the console
    console.error('Fetch error:', error);
    return null;
  }
}
`;

// --- Test Case 2: Human-Written Style ---
// A bit "messy", single-letter vars, no comments, quirky logic.
const HUMAN_CODE_SAMPLE = `
async function getData(url) {
  const res = await fetch(url);
  if (res.status !== 200) {
    console.log('whoops!', res.status);
    return; // Just fails silently
  }
  const d = await res.json();
  return d.records; // Assumes a specific structure
}
`;

// This is the "brain" - the prompt from your server
async function analyzeCode(codeToTest) {
  console.log(`--- Analyzing Sample ---`);
  
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
    ${codeToTest}
    """
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      // model: 'llama3-8b-8192',
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content;
    
    // Print the clean JSON response
    console.log(JSON.parse(aiResponse));

  } catch (error) {
    console.error('API Error:', error);
  }
}

// --- Run the tests ---
async function runTests() {
  console.log("Testing AI-like code...");
  await analyzeCode(AI_CODE_SAMPLE);
  
  console.log("\nTesting Human-like code...");
  await analyzeCode(HUMAN_CODE_SAMPLE);
}

runTests();