const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  const models = await genAI.getModels();
  console.log(models);
}
run().catch(console.error);
