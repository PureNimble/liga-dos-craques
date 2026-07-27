import { useState } from 'react';
import { Button, Input } from '@/shared/components/ui';
import { useT } from '@/shared/i18n/useT';
import type { Team } from '@/types/database';
import { useUpdateGameTeam, type GameTeam } from '../hooks/teamHooks';
import { TeamLogoUpload } from './TeamLogoUpload';
import s from './TeamIdentityEditor.module.css';

interface TeamIdentityEditorProps {
  gameId: string;
  side: Team;
  team: GameTeam | undefined;
  fallbackName: string;
}

/** Organizer-only control to rename a team and set its logo. */
export function TeamIdentityEditor({ gameId, side, team, fallbackName }: TeamIdentityEditorProps) {
  const { t } = useT();
  const update = useUpdateGameTeam(gameId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const name = team?.name || fallbackName;

  function startEditing() {
    setDraft(name);
    setEditing(true);
  }

  function save() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) update.mutate({ side, name: trimmed });
    setEditing(false);
  }

  return (
    <div className={s.editor}>
      <TeamLogoUpload
        gameId={gameId}
        side={side}
        name={name}
        logoUrl={team?.logo_url ?? null}
        onUploaded={(url) => update.mutate({ side, logo_url: url })}
      />
      {editing ? (
        <div className={s.renameRow}>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') setEditing(false);
            }}
            autoFocus
          />
          <Button size="sm" onClick={save}>
            {t('teams.renameSave')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
            {t('teams.renameCancel')}
          </Button>
        </div>
      ) : (
        <button type="button" className={s.nameButton} onClick={startEditing}>
          {name}
        </button>
      )}
    </div>
  );
}
