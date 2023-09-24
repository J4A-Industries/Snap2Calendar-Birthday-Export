import type { PlasmoMessaging } from '@plasmohq/messaging';
import { bgString } from '../index';

/**
 * This handles the request from the CS
 */
const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log(`Recieved: ${req.name}, sending ${bgString}`);
  res.send(bgString);
};

export default handler;
