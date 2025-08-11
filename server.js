require('dotenv').config();
const OpenAI = require('openai');
const express = require('express');
const Parser = require('rss-parser');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname)));
app.use(cors({ origin: '*' }));

const parser = new Parser({
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; sentiment-bot/1.0)' },
  timeout: 10000
});




// updated 
async function getSentimentScore(text) {
  if (text.length < 20 || openaiCallCount >= MAX_OPENAI_CALLS) {
    return localSentimentScore(text);
  }

  try {
    openaiCallCount++;
    console.log(`OpenAI scoring (call #${openaiCallCount})`);

    const aiResponse = await openai.chat.completions.create({
      
      model: "gpt-4o-mini",
      temperature: 0,
      
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a bilingual assistant trained to detect bias framing in headlines and news snippets in English or French.
Analyze the emotional content and potential bias in this news text using perspective-aware decoding, that is to consider how different political or ideological perspectives are treated, what assumptions are made, and how moral or intellectual legitimacy is granted or denied to different viewpoints.
Important rule for emotional language:
Do not classify emotional or violent language (e.g., “killed”, "genocide", “airstrike”, “bombed”, “famine”, “exorbitant”) as bias if:
It is attributed to a known actor, or if It describes verifiable, factual harm, and if It follows standard journalistic usage.
In such cases, do not use “Loaded Language” as the framing type unless the wording exaggerates, speculates, or is clearly intended to provoke without factual grounding. 
Instead, focus on thematic framing (e.g., “Humanitarian Crisis”, “Conflict and Consequences”, “Human Impact”).

Return ONLY valid JSON. Do not include commentary or code fences. Schema:
{
  "bias_score": number,            // 0–3
  "framing_type": string,          // One of: "Humanitarian Crisis", "Conflict and Consequences", ...
  "confidence_pct": number,        // 0–100
  "reason_summary": string
}
Rules:
- Do NOT label factual, attributed harm language as "Loaded Language" unless it exaggerates/speculates per the criteria.`
        },
        { role: "user", content: text }
      ]
    });

    const content = aiResponse.choices[0].message.content;
    const parsed = JSON.parse(content);

    return {
      score: Number(parsed.bias_score),
      emotion: String(parsed.framing_type),
      reason: String(parsed.reason_summary),
      confidence: Number(parsed.confidence_pct)
    };

  } catch (err) {
    console.error("❌ OpenAI scoring failed:", err.message);
    return localSentimentScore(text);
  }
}

function safeParseJSON(s) {
  try { return JSON.parse(s); } catch {}

  const m = s.match(/{[\s\S]*}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  throw new Error("Model did not return valid JSON");
}

            
