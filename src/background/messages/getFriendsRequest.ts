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
  console.log(req.body);
  const storage = new Storage({
    area: 'local',
  });

  const storedFriends: storedFriends = {
    storedAt: new Date(),
    friends: req.body.friends,
  };

  await storage.set('storedFriends', storedFriends);

  res.send(true);
};

export default handler;
