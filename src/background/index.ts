import { Storage } from '@plasmohq/storage';
import { handleFetchRequests } from './handleFetchRequests';

try {
  const storage = new Storage();
  storage.set('storedString', 'hi, I\'m a stored string');
} catch (err: any) {
  console.error(`Error caught in background.js: ${err.stack}`);
}

const inject = async (tabId: number) => {
  console.log('Injecting');
  chrome.scripting.executeScript(
    {
      target: {
        tabId,
      },
      world: 'MAIN', // MAIN in order to access the window object
      func: handleFetchRequests,
    },
    () => {
      console.log('Injected');
    },
  );
};

/**
 * If the user is on https://web.snapchat.com/, inject the script
 */
chrome.tabs.onUpdated.addListener((e, changeInfo, tab) => {
  if (tab.url && tab.url.match(/https?:\/\/web\.snapchat\.com\/.*?/)) {
    inject(e);
  }
});

/**
 * When the user first installs the extension, open the main page
 */
chrome.runtime.onInstalled.addListener((object) => {
  const internalUrl = chrome.runtime.getURL('tabs/main.html');

  if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: internalUrl });
  }
});
