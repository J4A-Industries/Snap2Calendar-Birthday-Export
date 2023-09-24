import type { PlasmoMessaging } from '@plasmohq/messaging';
import { bgString } from '../index';

/**
 * This handles the request from the CS
 */
const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log(req.body);
  res.send(true);
};

export default handler;
