import { Storage } from '@plasmohq/storage';
import { handleFetchRequests } from './handleFetchRequests';
import { AnalyticsEvent } from '@/misc/GA';

try {
  const storage = new Storage();
  storage.set('storedString', 'hi, I\'m a stored string');
} catch (err: any) {
  console.error(`Error caught in background.js: ${err.stack}`);
}

const inject = async (tabId: number) => {
  chrome.scripting.executeScript(
    {
      target: {
        tabId,
      },
      world: 'MAIN', // MAIN in order to access the window object
      func: handleFetchRequests,
    },
  );
};

// More permissive regex that handles various snapchat.com paths including /web with hash fragments
const isSnapchatWebUrl = (url: string): boolean => url.match(/^(?:https?:\/\/)?(?:www\.)?snapchat\.com\/web(?:[/#].*)?$/i) !== null;

/**
 * If the user is on https://snapchat.com/web, inject the script
 */
chrome.tabs.onUpdated.addListener((e, changeInfo, tab) => {
  if (tab.url && isSnapchatWebUrl(tab.url)) {
    inject(e);
  }
});

/**
 * When the user first installs the extension, open the main page
 */
chrome.runtime.onInstalled.addListener(async (object) => {
  if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    const internalUrl = chrome.runtime.getURL('tabs/main.html');
    chrome.tabs.create({ url: internalUrl });
    const platform = await chrome.runtime.getPlatformInfo();

    AnalyticsEvent([
      {
        name: 'install',
        params: {
          platform: platform.os,
        },
      },
    ]);
  }
});
