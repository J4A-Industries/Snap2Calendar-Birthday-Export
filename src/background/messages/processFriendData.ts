import type { PlasmoMessaging } from '@plasmohq/messaging';
import { Storage } from '@plasmohq/storage';
import { decodeProtobufFriends, convertToFriendFormat, uint8ToBase64 } from '../decoder';

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log('[Snap2Calendar] Received raw friend data from MAIN world');

  try {
    let { base64 } = req.body;

    // Decode from base64 to check for gRPC header
    const binaryString = atob(base64);
    let bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log('[Snap2Calendar] Response size:', bytes.length, 'bytes');

    // Strip gRPC-web header if present (1 byte flag + 4 bytes length)
    if (bytes.length > 5 && bytes[0] === 0x00) {
      const messageLength = (bytes[1] << 24) | (bytes[2] << 16) | (bytes[3] << 8) | bytes[4];
      console.log('[Snap2Calendar] gRPC message length:', messageLength);
      if (messageLength > 0 && messageLength <= bytes.length - 5) {
        bytes = bytes.slice(5, 5 + messageLength);
        base64 = uint8ToBase64(bytes);
      }
    }

    // Try to decode
    let decoded;

    // Check if it's base64-encoded text inside
    try {
      const text = new TextDecoder().decode(bytes);
      if (/^[A-Za-z0-9+/=\s]+$/.test(text) && text.length > 100) {
        console.log('[Snap2Calendar] Detected base64 response inside');
        decoded = decodeProtobufFriends(text.replace(/\s/g, ''));
      }
    } catch {}

    // Try raw protobuf
    if (!decoded || decoded.length === 0) {
      console.log('[Snap2Calendar] Trying raw protobuf decode');
      decoded = decodeProtobufFriends(base64);
    }

    if (decoded && decoded.length > 0) {
      console.log('[Snap2Calendar] Decoded', decoded.length, 'friends');

      const converted = convertToFriendFormat(decoded);

      // Store in extension storage
      const storage = new Storage({ area: 'local' });
      await storage.set('storedFriends', {
        storedAt: new Date(),
        friends: converted.friends,
      });

      console.log('[Snap2Calendar] Friend data stored successfully');

      // Switch back to the extension tab using stored tab ID
      const returnTab = await storage.get<{ tabId: number; windowId: number }>('returnTab');
      if (returnTab?.tabId) {
        try {
          await chrome.tabs.update(returnTab.tabId, { active: true });
          await chrome.windows.update(returnTab.windowId, { focused: true });
          console.log('[Snap2Calendar] Switched back to extension tab');
        } catch (err) {
          console.log('[Snap2Calendar] Could not switch to return tab:', err);
        }
      }

      res.send({ success: true, count: decoded.length });
    } else {
      console.log('[Snap2Calendar] No friends decoded from response');
      res.send({ success: false, error: 'No friends decoded' });
    }
  } catch (err) {
    console.error('[Snap2Calendar] Error processing friend data:', err);
    res.send({ success: false, error: String(err) });
  }
};

export default handler;
