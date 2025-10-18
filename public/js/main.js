// public/js/main.js

document.addEventListener("DOMContentLoaded", () => {
  const checkForm = document.getElementById("check-form");
  const suspectCodeInput = document.getElementById("suspect-code");
  const resultsContainer = document.getElementById("results-container");
  const checkButton = document.getElementById("check-button");

  // We'll create a new element to show the AI score
  const scoreDisplay = document.createElement("h2");
  resultsContainer.prepend(scoreDisplay);

  checkForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const suspectCode = suspectCodeInput.value;

    checkButton.disabled = true;
    checkButton.textContent = "Analyzing...";
    scoreDisplay.textContent = ""; // Clear old score
    resultsContainer.style.display = "none";

    try {
      const response = await fetch("/check-ai-code", {
        // ★ Call our new route
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspectCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // Success! Display the new data from Groq
      resultsContainer.style.display = "block";

      // Example: "Likely AI-Generated: 85%"
      const scoreLabel =
        data.score > 75
          ? "Definitely AI"
          : data.score > 40
          ? "Likely AI"
          : "Likely Human";
      scoreDisplay.textContent = `${scoreLabel}: ${data.score}%`;

      // Add the explanation
      resultsContainer.innerHTML = `<h3>Reasoning:</h3><p>${data.reason}</p>`;
    } catch (error) {
      resultsContainer.style.display = "block";
      scoreDisplay.textContent = "Error";
      resultsContainer.innerHTML = `<p class="error">${error.message}</p>`;
    } finally {
      checkButton.disabled = false;
      checkButton.textContent = "Check for AI";
    }
  });
});
