/* eslint-disable */
import type { PlasmoCSConfig } from 'plasmo';
import { sendToBackgroundViaRelay } from '@plasmohq/messaging';

/**
 * MAIN world content script for Snapchat web
 * Intercepts fetch requests and sends raw data to service worker for processing
 */
export const config: PlasmoCSConfig = {
  matches: ['*://www.snapchat.com/web/*'],
  run_at: 'document_start',
  world: 'MAIN',
};

const init = () => {
  // Match SyncFriendData on both web.snapchat.com and www.snapchat.com
  const syncFriendDataRegex = /https?:\/\/(web|www)\.snapchat\.com\/com\.snapchat\.atlas\.gw\.AtlasGw\/SyncFriendData/;

  const nativeFetch = window.fetch;
  let isIntercepting = false;

  const handler = {
    async apply(target: typeof fetch, thisArg: any, argumentsList: any[]) {
      const returned = await target.apply(thisArg, argumentsList) as Response;

      if (isIntercepting) return returned;

      const url = returned.url || (argumentsList[0] as string);
      if (!url.match(syncFriendDataRegex)) return returned;

      isIntercepting = true;
      try {
        const cloned = returned.clone();
        const buffer = await cloned.arrayBuffer();
        const bytes = new Uint8Array(buffer);

        // Convert to base64 in chunks to avoid stack overflow
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        const base64 = btoa(binary);

        sendToBackgroundViaRelay({ name: 'processFriendData', body: { base64 } });
      } catch (err) {
        alert('SNAP2CAL ERROR: ' + String(err));
      } finally {
        isIntercepting = false;
      }

      return returned;
    },
  };

  window.fetch = new Proxy(nativeFetch, handler);
};

init();
