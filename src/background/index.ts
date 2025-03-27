import { Storage } from '@plasmohq/storage';
import { AnalyticsEvent } from '@/misc/GA';

try {
  const storage = new Storage();
  storage.set('storedString', 'hi, I\'m a stored string');
} catch (err: any) {
  console.error(`Error caught in background.js: ${err.stack}`);
}

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
