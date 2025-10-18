import express from "express";
import path from "path";
import { title } from "process";
import { fileURLToPath } from "url";

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Set EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.get("/", (req, res) => {
  res.render("index", { title: "Home Page", user: "Cartikeya" });
});
app.get("/prompt", (re1, res) => {
  res.render("prompts/prompt", { title: "prompt page", user: "Cartikeya" });
});

// Start the server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
