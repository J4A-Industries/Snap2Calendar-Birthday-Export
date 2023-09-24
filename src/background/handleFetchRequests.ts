import { sendToBackgroundViaRelay } from '@plasmohq/messaging';

/**
 * This is a very janky function to intercept the friends request
 * and to set it to the friends-storage-area meta tag, to be read by the cs
 */
export const handleFetchRequests = () => {
  // if the storage area already exists, the function has already been run
  if (document.querySelector('#friends-storage-area')) return;

  const friendsRegex = /https?:\/\/web\.snapchat\.com\/ami\/friends(\?.*)?/;

  const nativeFetch = window.fetch;

  const storageArea = document.createElement('meta');

  storageArea.setAttribute('id', 'friends-storage-area');

  document.head.appendChild(storageArea);

  const handleNewIntercepted = async (data: any) => {
    storageArea.innerText = JSON.stringify(data);
  };

  const handler = {
    async apply(target, thisArg, argumentsList) {
      console.log(`Fetch to get ${JSON.stringify(argumentsList, null, 2)}`);
      // Expected output: "Calculate sum: 1,2"

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
