import { Storage } from '@plasmohq/storage';

const bgString = "hi, I'm a background string";

try {
  const storage = new Storage();
  storage.set('storedString', 'hi, I\'m a stored string');
} catch (err: any) {
  console.error(`Error caught in background.js: ${err.stack}`);
}

export { bgString };
