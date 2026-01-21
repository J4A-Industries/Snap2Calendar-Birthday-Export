/**
 * Protobuf decoder for Snapchat friend data
 */

// Helper to convert Uint8Array to base64 without stack overflow
export const uint8ToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
};

export const decodeProtobufFriends = (base64Data: string) => {
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
      // Use multiplication instead of bitshift to avoid 32-bit overflow
      result += (byte & 0x7f) * (2 ** shift);
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
    let addedTimestamp: number | undefined;

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

    // Field 6: timestamp when friend was added
    const tf = fields.get(6);
    if (tf) {
      for (const { wireType, value } of tf) {
        if (wireType === 0 && value > 1000000000) { // sanity check: after year 2001
          // Convert to milliseconds if it's in seconds (less than year 3000 in seconds)
          addedTimestamp = value < 100000000000 ? value * 1000 : value;
          break;
        }
      }
    }

    return username ? { username, displayName, birthdayMonth, birthdayDay, addedTimestamp } : null;
  };

  const friends: Array<{
    username: string;
    displayName: string;
    birthdayMonth?: number;
    birthdayDay?: number;
    addedTimestamp?: number;
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

export type DecodedFriend = ReturnType<typeof decodeProtobufFriends>[number];

// Convert to extension's Friend format
export const convertToFriendFormat = (decoded: DecodedFriend[]) => ({
  friends: decoded.map((f) => ({
    name: f.username,
    user_id: f.username,
    type: 0,
    display: f.displayName,
    birthday:
      f.birthdayMonth && f.birthdayDay
        ? `${f.birthdayMonth.toString().padStart(2, '0')}-${f.birthdayDay.toString().padStart(2, '0')}`
        : undefined,
    ts: f.addedTimestamp || Date.now(),
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
