import type { PlasmoMessaging } from '@plasmohq/messaging';
import { Storage } from '@plasmohq/storage';

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const storage = new Storage({ area: 'local' });
  const { tabId, windowId } = req.body;

  await storage.set('returnTab', { tabId, windowId });
  console.log('[Snap2Calendar] Stored return tab:', tabId, 'window:', windowId);

  res.send({ success: true });
};

export default handler;
