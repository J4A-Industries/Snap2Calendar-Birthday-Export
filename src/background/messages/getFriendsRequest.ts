import type { PlasmoMessaging } from '@plasmohq/messaging';
import { Storage } from '@plasmohq/storage';
import type { Friend } from '@/background/friendsType';

export interface incomingFriend {
	friends: Friend[];
}

export interface storedFriends {
	storedAt: Date;
	friends: Friend[];
}

/**
 * This handles the request from the CS to get the friends
 */
const handler: PlasmoMessaging.MessageHandler<incomingFriend, boolean> = async (req, res) => {
  console.log('Friend handler received data:', req.body.friends.length, 'friends');

  const storage = new Storage({
    area: 'local',
  });

  // Check if we already have stored friends
  let existingFriends = null;
  try {
    existingFriends = await storage.get('storedFriends');
    console.log('Existing friends found:', existingFriends ? 'yes' : 'no');
  } catch (err) {
    console.log('Error checking for existing friends:', err);
  }

  // Store the new friends data
  const storedFriends: storedFriends = {
    storedAt: new Date(),
    friends: req.body.friends,
  };

  try {
    await storage.set('storedFriends', storedFriends);
    console.log('Successfully stored', req.body.friends.length, 'friends');
  } catch (err) {
    console.error('Error storing friends:', err);
  }

  // If this is the first time we're getting friends data, open the extension page
  if (!existingFriends) {
    const extensionMainUrl = chrome.runtime.getURL('tabs/main.html');
    console.log('First-time friends data, opening extension page:', extensionMainUrl);

    try {
      // This doesn't require tabs permission
      chrome.tabs.create({ url: extensionMainUrl });
      console.log('New tab created successfully');
    } catch (err) {
      console.error('Error creating new tab:', err);
    }
  } else {
    console.log('Friends data already existed, not opening a new tab');
  }

  res.send(true);
};

export default handler;
