const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
let apiKey = '';
envContent.split('\n').forEach(line => {
  if (line.startsWith('ANTHROPIC_API_KEY=')) {
    apiKey = line.split('=')[1].replace(/"/g, '').trim();
  }
});

const client = new Anthropic({ apiKey });

async function run() {
  try {
    console.log('Testing with claude-opus-4-5...');
    const res = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Say hello in 5 words.' }],
    });
    console.log('Success:', res.content[0].text);
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

run();
