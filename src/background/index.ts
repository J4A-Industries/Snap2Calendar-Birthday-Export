import { Storage } from '@plasmohq/storage';
import Browser from 'webextension-polyfill';
import injectedCode from 'url:./handleFetchRequests.ts';
import { sendToBackgroundViaRelay } from '@plasmohq/messaging';
import { handleFetchRequests } from './handleFetchRequests';

const bgString = "hi, I'm a background string";

try {
  const storage = new Storage();
  storage.set('storedString', 'hi, I\'m a stored string');
} catch (err: any) {
  console.error(`Error caught in background.js: ${err.stack}`);
}

export { bgString };

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

// Simple example showing how to inject.
// You can inject however you'd like to, doesn't have
// to be with chrome.tabs.onActivated
chrome.tabs.onUpdated.addListener((e, changeInfo, tab) => {
  if (tab.url && tab.url.match(/https?:\/\/web\.snapchat\.com\/.*?/)) {
    inject(e);
  }
});

chrome.runtime.onInstalled.addListener((object) => {
  const internalUrl = chrome.runtime.getURL('tabs/main.html');

  if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: internalUrl });
  }
});
