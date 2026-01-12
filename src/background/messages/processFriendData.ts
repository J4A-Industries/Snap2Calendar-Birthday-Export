import type { PlasmoMessaging } from '@plasmohq/messaging';
import { Storage } from '@plasmohq/storage';

// Protobuf decoder
const decodeProtobufFriends = (base64Data: string) => {
  const binaryString = atob(base64Data);
  const data = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    data[i] = binaryString.charCodeAt(i);
  }

  const readVarint = (d: Uint8Array, pos: number): [number, number] => {
    let result = 0;
    let shift = 0;
    while (pos < d.length) {
      const byte = d[pos];
      result |= (byte & 0x7f) << shift;
      pos++;
      if (!(byte & 0x80)) break;
      shift += 7;
    }
    return [result, pos];
  };

  const parseFields = (d: Uint8Array) => {
    const fields = new Map<number, Array<{ wireType: number; value: any }>>();
    let pos = 0;
    while (pos < d.length) {
      try {
        const [tag, newPos] = readVarint(d, pos);
        pos = newPos;
        const fieldNum = tag >> 3;
        const wireType = tag & 0x7;
        let value: any;
        switch (wireType) {
          case 0:
            [value, pos] = readVarint(d, pos);
            break;
          case 1:
            pos += 8;
            value = 0;
            break;
          case 2:
            const [len, afterLen] = readVarint(d, pos);
            pos = afterLen;
            if (pos + len > d.length) return fields;
            value = d.slice(pos, pos + len);
            pos += len;
            break;
          case 5:
            pos += 4;
            value = 0;
            break;
          default:
            return fields;
        }
        if (!fields.has(fieldNum)) fields.set(fieldNum, []);
        fields.get(fieldNum)!.push({ wireType, value });
      } catch {
        break;
      }
    }
    return fields;
  };

  const tryDecode = (d: Uint8Array): string | null => {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(d);
    } catch {
      return null;
    }
  };

  const parseBirthday = (d: Uint8Array) => {
    const f = parseFields(d);
    let month: number | undefined;
    let day: number | undefined;
    const mf = f.get(2);
    if (mf) {
      for (const { wireType, value } of mf) {
        if (wireType === 0) {
          month = value;
          break;
        }
      }
    }
    const df = f.get(3);
    if (df) {
      for (const { wireType, value } of df) {
        if (wireType === 0) {
          day = value;
          break;
        }
      }
    }
    return { month, day };
  };

  const parseFriend = (d: Uint8Array) => {
    const fields = parseFields(d);
    let username = '';
    let displayName = '';
    let birthdayMonth: number | undefined;
    let birthdayDay: number | undefined;

    const uf = fields.get(2);
    if (uf) {
      for (const { wireType, value } of uf) {
        if (wireType === 2) {
          const s = tryDecode(value);
          if (s && s.length >= 3 && s.length <= 30 && !s.includes(' ')) {
            username = s;
            break;
          }
        }
      }
    }

    const dnf = fields.get(3);
    if (dnf) {
      for (const { wireType, value } of dnf) {
        if (wireType === 2) {
          const s = tryDecode(value);
          if (s) {
            displayName = s;
            break;
          }
        }
      }
    }

    const bf = fields.get(5);
    if (bf) {
      for (const { wireType, value } of bf) {
        if (wireType === 2 && value.length >= 4 && value.length <= 8) {
          const { month, day } = parseBirthday(value);
          if (month && day) {
            birthdayMonth = month;
            birthdayDay = day;
            break;
          }
        }
      }
    }

    return username ? {
      username, displayName, birthdayMonth, birthdayDay,
    } : null;
  };

  const friends: Array<{
    username: string;
    displayName: string;
    birthdayMonth?: number;
    birthdayDay?: number;
  }> = [];
  const seen = new Set<string>();

  let pos = 0;
  while (pos < data.length - 10) {
    if (data[pos] === 0x12) {
      try {
        const [length, newPos] = readVarint(data, pos + 1);
        if (length > 50 && length < 2000 && newPos + length <= data.length) {
          const friend = parseFriend(data.slice(newPos, newPos + length));
          if (friend && !seen.has(friend.username)) {
            friends.push(friend);
            seen.add(friend.username);
          }
        }
      } catch {}
    }
    pos++;
  }

  return friends;
};

// Convert to extension's Friend format
const convertToFriendFormat = (
  decoded: ReturnType<typeof decodeProtobufFriends>,
) => ({
  friends: decoded.map((f) => ({
    name: f.username,
    user_id: f.username,
    type: 0,
    display: f.displayName,
    birthday:
      f.birthdayMonth && f.birthdayDay
        ? `${f.birthdayMonth.toString().padStart(2, '0')}-${f.birthdayDay.toString().padStart(2, '0')}`
        : undefined,
    ts: Date.now(),
    direction: 'OUTGOING',
    can_see_custom_stories: true,
    expiration: 0,
    friendmoji_string: '',
    friendmojis: [],
    snap_streak_count: 0,
    is_popular: false,
    is_story_muted: false,
    mutable_username: f.username,
    cameos_sharing_policy: 0,
    plus_badge_visibility: 0,
  })),
});

// Helper to convert Uint8Array to base64 without stack overflow
const uint8ToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
};

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
        // Re-encode to base64 for decoder (chunked to avoid stack overflow)
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
      console.log('[Snap2Calendar] Successfully decoded', decoded.length, 'friends');
      const withBirthdays = decoded.filter(
        (f) => f.birthdayMonth && f.birthdayDay,
      ).length;
      console.log('[Snap2Calendar]', withBirthdays, 'friends have birthdays');

      const converted = convertToFriendFormat(decoded);

      // Store in extension storage
      const storage = new Storage({ area: 'local' });
      await storage.set('storedFriends', {
        storedAt: new Date(),
        friends: converted.friends,
      });

      console.log('[Snap2Calendar] Friend data stored successfully');
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
