const callOpenAI = require("./openai");
const callGemini = require("./gemini");
const callMistral = require("./mistral");
const callClaude = require("./claude");
const callCohere = require("./cohere");
const callPerplexity = require("./perplexity");
const callTogether = require("./together");
const callGroq = require("./groq");
const callFireworks = require("./fireworks");
const callAzureOpenAI = require("./azureOpenAI");
const callOpenRouter = require("./openrouter");
const callDeepInfra = require("./deepinfra");
const callXAI = require("./xai");
const callDeepSeek = require("./deepseek");

const providers = {
  openai: callOpenAI,
  gemini: callGemini,
  mistral: callMistral,
  claude: callClaude,
  cohere: callCohere,
  perplexity: callPerplexity,
  together: callTogether,
  groq: callGroq,
  fireworks: callFireworks,
  azureopenai: callAzureOpenAI,
  openrouter: callOpenRouter,
  deepinfra: callDeepInfra,
  xai: callXAI,
  deepseek: callDeepSeek,
};

module.exports = { providers };
