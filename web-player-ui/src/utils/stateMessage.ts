export interface ParsedStateMessage {
  index: number;
  description: string;
  stateJson: string;
  mismatch: boolean;
}

const MISMATCH_PREFIX = 'Mismatch:';
const LEGACY_MESSAGE_REGEX = /^Index:(-?\d+)Description:(.*?)GameState:(.*)$/s;

function parseJsonEnvelope(
  data: string,
  mismatch: boolean,
): ParsedStateMessage | null {
  try {
    const envelope: unknown = JSON.parse(data);
    if (typeof envelope !== 'object' || envelope === null) return null;

    const { i, d, s } = envelope as Record<string, unknown>;
    if (typeof i !== 'number' || !Number.isInteger(i)) return null;
    if (typeof d !== 'string' || typeof s !== 'string') return null;

    return {
      index: i,
      description: d,
      stateJson: s,
      mismatch,
    };
  } catch {
    return null;
  }
}

export function parseStateMessage(data: string): ParsedStateMessage | null {
  const mismatch = data.startsWith(MISMATCH_PREFIX);
  const content = mismatch ? data.slice(MISMATCH_PREFIX.length) : data;

  if (content.startsWith('{')) {
    return parseJsonEnvelope(content, mismatch);
  }

  const legacyMatch = content.match(LEGACY_MESSAGE_REGEX);
  if (!legacyMatch) return null;

  return {
    index: Number.parseInt(legacyMatch[1], 10),
    description: legacyMatch[2],
    stateJson: legacyMatch[3],
    mismatch,
  };
}
