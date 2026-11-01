import React from 'react';
import { GameStateData, gameManager } from '../../core/gameState';
import { betterGearInBag } from '../../core/guidance';
import { ui } from '../../i18n/ui';
import { Segmented } from '../Segmented';
import { GearTab } from './GearTab';
import { SkillsTab } from './SkillsTab';

export const FighterTab: React.FC<{ state: GameStateData }> = ({ state }) => {
  const view = state.fighterView || 'gear';
  return (
    <div className="w-full flex flex-col bg-[#06070a]">
      <div className="px-3 pt-3">
        <Segmented
          value={view}
          onChange={(v) => gameManager.setActiveTab('gear', v)}
          options={[
            { id: 'gear', label: ui(state.lang, 'view_gear'), badge: betterGearInBag(state) > 0 },
            { id: 'skills', label: ui(state.lang, 'view_skills') },
          ]}
        />
      </div>
      {view === 'skills' ? <SkillsTab state={state} /> : <GearTab state={state} />}
    </div>
  );
};
