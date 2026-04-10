/**
 * Map server class IDs to Frosthaven asset filenames.
 * Server sends class names like "Frozen Fist", assets use "fh-frozen-fist".
 */
function classIdToSlug(classId: string): string {
  return 'fh-' + classId.toLowerCase().replace(/\s+/g, '-');
}

export function getClassIcon(classId: string): string {
  const slug = classIdToSlug(classId);
  return `/icons/classes/${slug}-bw-icon.png`;
}

export function getClassPortrait(classId: string): string {
  const slug = classIdToSlug(classId);
  return `/icons/portraits/${slug}.png`;
}

export function getConditionColorIcon(condition: string): string {
  // Map condition names to icon filenames
  // Server sends: "poisoned" -> file is "fh-poison-color-icon.png"
  const nameMap: Record<string, string> = {
    poisoned: 'poison',
    wounded: 'wound',
    muddle: 'muddle',
    immobilize: 'immobilize',
    disarm: 'disarm',
    stun: 'stun',
    invisible: 'invisible',
    strengthen: 'strengthen',
    bless: 'bless',
    curse: 'curse',
    regenerate: 'regenerate',
    ward: 'ward',
    brittle: 'brittle',
    bane: 'bane',
    impair: 'impair',
  };
  const slug = nameMap[condition] ?? condition;
  return `/icons/conditions-color/fh-${slug}-color-icon.png`;
}

export function getGeneralIcon(name: string): string {
  return `/icons/general/fh-${name}-bw-icon.png`;
}
