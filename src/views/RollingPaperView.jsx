'use client';

import React, { useMemo } from 'react';
import { useSocket } from '../context/SocketContext';
import { createSupabaseBrowserClient } from '../lib/supabase/client';
import {
  createLocalRollingPaperAdapter,
  createSupabaseRollingPaperAdapter,
  isUuid,
  MOCK_ROLLING_MESSAGES,
  MOCK_ROLLING_PARTY,
  MOCK_ROLLING_PROFILES,
  RollingPaperFeature,
} from '../features/rolling-paper';

function uniqueProfiles(profiles) {
  return Array.from(
    new Map(profiles.filter(Boolean).map((profile) => [profile.id, profile])).values()
  );
}

export const RollingPaperView = () => {
  const { party, host, guests, currentUser, rollingPapers, triggerConfetti } = useSocket();

  const resolvedParty = party || MOCK_ROLLING_PARTY;
  const resolvedCurrentProfile = currentUser || MOCK_ROLLING_PROFILES[0];
  const profiles = useMemo(() => {
    const liveProfiles = uniqueProfiles([host, ...guests]);
    return liveProfiles.length > 1 ? liveProfiles : MOCK_ROLLING_PROFILES;
  }, [guests, host]);
  const seedMessages = rollingPapers.length > 0 ? rollingPapers : MOCK_ROLLING_MESSAGES;

  const adapter = useMemo(() => {
    const hasSupabaseEnvironment = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );
    const canUseSupabase =
      hasSupabaseEnvironment &&
      isUuid(resolvedParty.id) &&
      isUuid(resolvedCurrentProfile.id);

    if (canUseSupabase) {
      return createSupabaseRollingPaperAdapter({
        supabase: createSupabaseBrowserClient(),
        partyId: resolvedParty.id,
        profileId: resolvedCurrentProfile.id,
        profiles,
      });
    }

    return createLocalRollingPaperAdapter({
      partyId: resolvedParty.id,
      seedMessages,
      profiles,
    });
  }, [profiles, resolvedCurrentProfile.id, resolvedParty.id, seedMessages]);

  return (
    <RollingPaperFeature
      adapter={adapter}
      party={resolvedParty}
      currentProfile={resolvedCurrentProfile}
      profiles={profiles}
      onCelebrate={() => triggerConfetti({ particleCount: 70, spread: 65 })}
    />
  );
};
