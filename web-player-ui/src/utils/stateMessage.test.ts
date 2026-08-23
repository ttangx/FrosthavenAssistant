import { describe, expect, it } from 'vitest';

import { parseStateMessage } from './stateMessage';

describe('parseStateMessage', () => {
  it('parses the canonical JSON state envelope', () => {
    expect(
      parseStateMessage(
        '{"i":2,"d":"draw","e":{"type":"none"},"s":"{\\"round\\":1}"}',
      ),
    ).toEqual({
      index: 2,
      description: 'draw',
      stateJson: '{"round":1}',
      mismatch: false,
    });
  });

  it('keeps legacy state envelopes readable during deployment overlap', () => {
    expect(
      parseStateMessage('Index:3Description:change healthGameState:{"round":2}'),
    ).toEqual({
      index: 3,
      description: 'change health',
      stateJson: '{"round":2}',
      mismatch: false,
    });
  });

  it('marks a canonical mismatch envelope', () => {
    expect(
      parseStateMessage(
        'Mismatch:{"i":4,"d":"server correction","e":{"type":"none"},"s":"{\\"round\\":3}"}',
      ),
    ).toEqual({
      index: 4,
      description: 'server correction',
      stateJson: '{"round":3}',
      mismatch: true,
    });
  });

  it('returns an envelope with an empty state for the caller to ignore', () => {
    expect(
      parseStateMessage('{"i":-1,"d":"","e":{"type":"none"},"s":""}'),
    ).toEqual({
      index: -1,
      description: '',
      stateJson: '',
      mismatch: false,
    });
  });

  it.each([
    '{"i":"2","d":"draw","s":"{}"}',
    '{"i":2,"d":"draw","s":{}}',
    '{broken json',
    '{"type":"pong"}',
    'ping',
  ])('rejects malformed or non-state input: %s', (message) => {
    expect(parseStateMessage(message)).toBeNull();
  });
});
