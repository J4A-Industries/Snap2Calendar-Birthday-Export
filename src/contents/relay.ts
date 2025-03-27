import { relayMessage } from '@plasmohq/messaging';
import type { PlasmoCSConfig } from 'plasmo';

export const config: PlasmoCSConfig = {
  matches: [
    '*://www.snapchat.com/web/*',
    '*://www.snapchat.com/web',
    '*://snapchat.com/web/*',
    '*://snapchat.com/web',
    'https://*.snapchat.com/web*',
  ],
  run_at: 'document_start',
};

relayMessage({
  name: 'getFriendsRequest',
});
