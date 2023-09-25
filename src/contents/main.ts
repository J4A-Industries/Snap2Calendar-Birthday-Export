import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo';
import { sendToBackground } from '@plasmohq/messaging';

/**
 * Execute the script on the tinder website,
 * Running in 'main' world, which means it has access to the DOM
 */
export const config: PlasmoCSConfig = {
  matches: ['*://web.snapchat.com/*'],
  run_at: 'document_idle',
  css: ['./style.css'],
};

const init = async () => {
  let storageArea = document.querySelector('#friends-storage-area') as HTMLMetaElement;
  // if the storage area hasn't been created yet, wait until it has
  if (!storageArea) {
    await new Promise((resolve) => {
      const getStorageInterval = setInterval(() => {
        storageArea = document.querySelector('#friends-storage-area');
        if (storageArea) {
          clearInterval(getStorageInterval);
          resolve(null);
        }
      }, 10);
    });
  }

  // if the storage area is still empty, wait it's been filled with the friends
  if (storageArea.innerText === '') {
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (storageArea.innerText !== '') {
          clearInterval(interval);
          resolve(null);
        }
      }, 10);
    });
  }

  console.log('Got the friends!');

  const friends = JSON.parse(storageArea.innerText);

  const res = await sendToBackground({
    name: 'getFriendsRequest',
    body: friends,
  });

  console.log(res);
};

init();
