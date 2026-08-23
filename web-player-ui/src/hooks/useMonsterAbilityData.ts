import { useEffect, useState } from 'react';

import {
  loadMonsterAbilityData,
  type AbilityData,
} from '../utils/monsterAbilities';

export function useMonsterAbilityData(): AbilityData | null {
  const [abilityData, setAbilityData] = useState<AbilityData | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadMonsterAbilityData()
      .then((data) => {
        if (isMounted) setAbilityData(data);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  return abilityData;
}
