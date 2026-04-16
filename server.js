const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getSystemPrompt(page, isLoggedIn) {
  if (page === "dashboard" && isLoggedIn) {
    return `
You are Avo's dashboard assistant.
Be patient, clear, helpful, and conversational.

Your job:
- Help the user understand arbitrage betting simply.
- If they are logged in and on the dashboard, guide them step by step.
- Explain that clicking an arb on the right loads both sides into the dashboard.
- Explain that changing one bet amount updates the counter bet and estimated profit.
- Explain that clicking the link next to the sportsbook logo opens the exact bet page.
- Keep replies concise and natural.
`;
  }

  return `
You are Avo's homepage assistant.
Be calm, smart, patient, and conversational.

Important behavior:
- Open naturally.
- Explain arbitrage simply.
- If user is not logged in, guide them to scroll down to "Try arbitrage right now".
- If user wants a walkthrough, explain that sportsbooks can disagree on odds and that Avo helps users lock in profit by finding those gaps.
- Do not sound robotic or overly salesy.
`;
}

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, page = "homepage", isLoggedIn = false } = req.body;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: getSystemPrompt(page, isLoggedIn),
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    res.json({
      reply: response.output_text || "Sorry, I hit an error."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      reply: "Sorry, the chatbot hit an error."
    });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
