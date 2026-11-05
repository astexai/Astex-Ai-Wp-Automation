import fs from 'fs';
import path from 'path';

const DEMO_DIR = path.join(process.cwd(), 'assets', 'demo');

export function findDemoVideo() {
  if (!fs.existsSync(DEMO_DIR)) return null;
  const file = fs.readdirSync(DEMO_DIR).find((name) => name.toLowerCase().endsWith('.mp4'));
  return file ? path.join(DEMO_DIR, file) : null;
}
