/**
 * Snapchat Friend Data Decoder
 * Decodes base64-encoded protobuf friend data from Snapchat
 */

export interface DecodedFriend {
  username: string;
  displayName: string;
  birthdayMonth?: number;
  birthdayDay?: number;
}

interface FieldMapping {
  username: number;
  displayName: number;
  birthday: number;
  birthdayMonth: number;
  birthdayDay: number;
}

// Default field mappings (as of Jan 2025)
const DEFAULT_FIELD_MAPPING: FieldMapping = {
  username: 2,
  displayName: 3,
  birthday: 5,
  birthdayMonth: 2,
  birthdayDay: 3,
};

type WireType = 0 | 1 | 2 | 5;
type FieldValue = { wireType: WireType; value: number | Uint8Array };
type ParsedFields = Map<number, FieldValue[]>;

function readVarint(data: Uint8Array, pos: number): [number, number] {
  let result = 0;
  let shift = 0;
  while (pos < data.length) {
    const byte = data[pos];
    result |= (byte & 0x7f) << shift;
    pos++;
    if (!(byte & 0x80)) break;
    shift += 7;
  }
  return [result, pos];
}

function parseProtobufFields(data: Uint8Array): ParsedFields {
  const fields: ParsedFields = new Map();
  let pos = 0;

  while (pos < data.length) {
    try {
      const [tag, newPos] = readVarint(data, pos);
      pos = newPos;

      const fieldNum = tag >> 3;
      const wireType = (tag & 0x7) as WireType;

      let value: number | Uint8Array;

      switch (wireType) {
        case 0:
          [value, pos] = readVarint(data, pos);
          break;
        case 1:
          if (pos + 8 > data.length) return fields;
          value = Number(new DataView(data.buffer, data.byteOffset + pos, 8).getBigUint64(0, true));
          pos += 8;
          break;
        case 2:
          const [length, afterLength] = readVarint(data, pos);
          pos = afterLength;
          if (pos + length > data.length) return fields;
          value = data.slice(pos, pos + length);
          pos += length;
          break;
        case 5:
          if (pos + 4 > data.length) return fields;
          value = new DataView(data.buffer, data.byteOffset + pos, 4).getUint32(0, true);
          pos += 4;
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
}

function tryDecodeString(data: Uint8Array): string | null {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return decoder.decode(data);
  } catch {
    return null;
  }
}

function parseBirthday(data: Uint8Array, mapping: FieldMapping): { month?: number; day?: number } {
  const fields = parseProtobufFields(data);
  let month: number | undefined;
  let day: number | undefined;

  const monthField = fields.get(mapping.birthdayMonth);
  if (monthField) {
    for (const { wireType, value } of monthField) {
      if (wireType === 0 && typeof value === 'number') {
        month = value;
        break;
      }
    }
  }

  const dayField = fields.get(mapping.birthdayDay);
  if (dayField) {
    for (const { wireType, value } of dayField) {
      if (wireType === 0 && typeof value === 'number') {
        day = value;
        break;
      }
    }
  }

  return { month, day };
}

function parseFriendMessage(data: Uint8Array, mapping: FieldMapping): DecodedFriend | null {
  const fields = parseProtobufFields(data);
  const friend: DecodedFriend = { username: '', displayName: '' };

  // Parse username
  const usernameField = fields.get(mapping.username);
  if (usernameField) {
    for (const { wireType, value } of usernameField) {
      if (wireType === 2 && value instanceof Uint8Array) {
        const str = tryDecodeString(value);
        if (str && str.length >= 3 && str.length <= 30 && !str.includes(' ')) {
          friend.username = str;
          break;
        }
      }
    }
  }

  // Parse display name
  const displayNameField = fields.get(mapping.displayName);
  if (displayNameField) {
    for (const { wireType, value } of displayNameField) {
      if (wireType === 2 && value instanceof Uint8Array) {
        const str = tryDecodeString(value);
        if (str) {
          friend.displayName = str;
          break;
        }
      }
    }
  }

  // Parse birthday
  const birthdayField = fields.get(mapping.birthday);
  if (birthdayField) {
    for (const { wireType, value } of birthdayField) {
      if (wireType === 2 && value instanceof Uint8Array) {
        const { month, day } = parseBirthday(value, mapping);
        if (month !== undefined && day !== undefined) {
          friend.birthdayMonth = month;
          friend.birthdayDay = day;
          break;
        }
      }
    }
  }

  return friend.username ? friend : null;
}

function analyzeMessageFields(
  data: Uint8Array,
  stats: Map<number, { count: number; usernameScore: number; displayNameScore: number; birthdayScore: number; wireType: number }>
): void {
  const fields = parseProtobufFields(data);

  for (const [fieldNum, values] of fields) {
    for (const { wireType, value } of values) {
      if (!stats.has(fieldNum)) {
        stats.set(fieldNum, { count: 0, usernameScore: 0, displayNameScore: 0, birthdayScore: 0, wireType });
      }
      const stat = stats.get(fieldNum)!;
      stat.count++;

      if (wireType === 2 && value instanceof Uint8Array) {
        const str = tryDecodeString(value);

        if (str && /^[a-z0-9._-]{3,30}$/.test(str)) {
          stat.usernameScore++;
        }

        const looksLikeKey = str && (
          str.length > 50 ||
          /^[A-Za-z0-9+/=]{40,}$/.test(str) ||
          str.includes('==') ||
          str.startsWith('MF')
        );

        if (str && !looksLikeKey && str.length <= 50 && (
          str.includes(' ') ||
          /[A-Z]/.test(str) ||
          /[\u{1F300}-\u{1F9FF}]/u.test(str) ||
          /[\u{2600}-\u{26FF}]/u.test(str)
        )) {
          stat.displayNameScore++;
        }

        if (value.length >= 4 && value.length <= 8) {
          const innerFields = parseProtobufFields(value);
          if (innerFields.has(2) && innerFields.has(3)) {
            const monthVal = innerFields.get(2)?.[0];
            const dayVal = innerFields.get(3)?.[0];
            if (monthVal?.wireType === 0 && dayVal?.wireType === 0) {
              const month = monthVal.value as number;
              const day = dayVal.value as number;
              if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                stat.birthdayScore++;
              }
            }
          }
        }
      }
    }
  }
}

/**
 * Auto-detect field mapping from sample data
 */
export function detectFieldMapping(data: Uint8Array): FieldMapping {
  const fieldStats = new Map<number, {
    count: number;
    usernameScore: number;
    displayNameScore: number;
    birthdayScore: number;
    wireType: number;
  }>();

  let pos = 0;
  let sampleCount = 0;
  const maxSamples = 50;

  while (pos < data.length - 10 && sampleCount < maxSamples) {
    if (data[pos] === 0x12) {
      try {
        const [length, newPos] = readVarint(data, pos + 1);
        if (length > 50 && length < 2000 && newPos + length <= data.length) {
          const msgData = data.slice(newPos, newPos + length);
          analyzeMessageFields(msgData, fieldStats);
          sampleCount++;
        }
      } catch {
        // Continue
      }
    }
    pos++;
  }

  let usernameField = 2;
  let displayNameField = 3;
  let birthdayField = 5;
  let maxUsernameScore = 0;
  let maxDisplayNameScore = 0;
  let maxBirthdayScore = 0;

  for (const [fieldNum, stats] of fieldStats) {
    const usernameRatio = stats.usernameScore / stats.count;
    const displayNameRatio = stats.displayNameScore / stats.count;
    const birthdayRatio = stats.birthdayScore / stats.count;

    if (usernameRatio > maxUsernameScore && usernameRatio > 0.8 && displayNameRatio < 0.2) {
      maxUsernameScore = usernameRatio;
      usernameField = fieldNum;
    }

    const displayNameBonus = fieldNum === 3 ? 0.1 : 0;
    if (displayNameRatio + displayNameBonus > maxDisplayNameScore && displayNameRatio > 0.5) {
      maxDisplayNameScore = displayNameRatio + displayNameBonus;
      displayNameField = fieldNum;
    }

    if (birthdayRatio > maxBirthdayScore && birthdayRatio > 0.8 && stats.wireType === 2) {
      maxBirthdayScore = birthdayRatio;
      birthdayField = fieldNum;
    }
  }

  return {
    username: usernameField,
    displayName: displayNameField,
    birthday: birthdayField,
    birthdayMonth: 2,
    birthdayDay: 3,
  };
}

/**
 * Decode friend data from raw Uint8Array (already decoded from base64)
 */
export function decodeFriendDataFromBytes(data: Uint8Array, fieldMapping?: FieldMapping): DecodedFriend[] {
  const mapping = fieldMapping || detectFieldMapping(data);
  const friends: DecodedFriend[] = [];
  const seenUsernames = new Set<string>();

  let pos = 0;
  while (pos < data.length - 10) {
    if (data[pos] === 0x12) {
      try {
        const [length, newPos] = readVarint(data, pos + 1);
        if (length > 50 && length < 2000 && newPos + length <= data.length) {
          const msgData = data.slice(newPos, newPos + length);
          const friend = parseFriendMessage(msgData, mapping);
          if (friend && !seenUsernames.has(friend.username)) {
            friends.push(friend);
            seenUsernames.add(friend.username);
          }
        }
      } catch {
        // Continue
      }
    }
    pos++;
  }

  return friends;
}

/**
 * Decode friend data from base64 string
 */
export function decodeFriendData(base64Data: string): DecodedFriend[] {
  const binaryString = atob(base64Data);
  const data = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    data[i] = binaryString.charCodeAt(i);
  }
  return decodeFriendDataFromBytes(data);
}

/**
 * Get friends with birthdays only
 */
export function getFriendsWithBirthdays(friends: DecodedFriend[]): DecodedFriend[] {
  return friends.filter(f => f.birthdayMonth !== undefined && f.birthdayDay !== undefined);
}
