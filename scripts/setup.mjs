# One-time setup: prepares the data directory and .env.local, prints next steps.
import fs from 'fs';
import path from 'path';

const root = process.cwd();
fs.mkdirSync(path.join(root, 'data'), { recursive: true });

const envPath = path.join(root, '.env.local');
if (!fs.existsSync(envPath) && fs.existsSync(path.join(root, '.env.example'))) {
  fs.copyFileSync(path.join(root, '.env.example'), envPath);
  console.log('✓ Created .env.local from .env.example (edit it!)');
} else {
  console.log('• .env.local already exists — leaving it alone');
}

console.log(`
╔══════════════════════════════════════════════════════════╗
║  SHADOW is ready.                                        ║
║                                                          ║
║  npm run dev      →  http://localhost:3000               ║
║                                                          ║
║  1. Open the app → Catalog → add your Meesho products    ║
║  2. Connectors → paste your AI key (DeepSeek/OpenAI)     ║
║  3. Follow /guide inside the app for Meta, WhatsApp,     ║
║     YouTube, X, Razorpay & cloud deployment              ║
╚══════════════════════════════════════════════════════════╝
`);
