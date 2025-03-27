import { sendToBackgroundViaRelay } from '@plasmohq/messaging';
import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo';
// import styleText from 'data-text:~src/contents/style.css';

/**
 * For some reason, injecting into the MAIN world on https://web.snapchat.com/ doesn't work.
 * TODO: Figure out why and use content scripts instead of script injection.
 */
export const config: PlasmoCSConfig = {
  matches: [
    '*://www.snapchat.com/web/*',
    '*://www.snapchat.com/web',
    '*://snapchat.com/web/*',
    '*://snapchat.com/web',
    'https://*.snapchat.com/web*',
  ],
  run_at: 'document_start',
  world: 'MAIN',
};

export const handleFetchRequests = () => {
  const friendsRegex = /https?:\/\/web\.snapchat\.com\/ami\/friends(\?.*)?/;

  const nativeFetch = window.fetch;

  const handleNewIntercepted = async (data: any) => {
    await sendToBackgroundViaRelay({
      name: 'getFriendsRequest',
      body: data,
    });
  };

  const handler = {
    async apply(target, thisArg, argumentsList) {
      const returned = await target(...argumentsList) as Response;

      if (returned.url.match(friendsRegex)) {
        const cloned = returned.clone();
        const data = await cloned.json();
        handleNewIntercepted(data);
      }

      return returned;
    },
  };

  const proxy = new Proxy(nativeFetch, handler);

  window.fetch = proxy;
};
handleFetchRequests();
