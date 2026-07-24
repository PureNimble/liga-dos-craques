import { useState, type FocusEvent, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useActiveGroup } from '@/features/groups/hooks/useActiveGroup';
import { GroupSwitcherModal } from '@/features/groups/components/GroupSwitcherModal';
import { AddGroupModal } from '@/features/groups/components/AddGroupModal';
import { PlusIcon } from '@/shared/components/ui/icons';
import s from './GroupRail.module.css';

function groupInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '');
}

interface HoverTarget {
  name: string;
  top: number;
  left: number;
}

/**
 * Coluna de grupos (tablet/desktop) — tocar num círculo troca logo de grupo;
 * clique direito ou duplo clique abre as definições DESSE grupo (código,
 * membros, sair — e administração se fores admin dele), sem ter de o tornar
 * ativo primeiro. "+" é só para ADICIONAR um grupo (criar/entrar). No
 * telemóvel não há espaço para a coluna — a troca continua a ser pelo botão
 * no Navbar.
 */
export function GroupRail() {
  const { groupId, myGroups, switchGroup } = useActiveGroup();
  const [manageGroupId, setManageGroupId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  // Um só nó de tooltip, posicionado por JS e desenhado fora da coluna (portal) —
  // assim não é cortado pelo overflow-y:auto da lista quando há muitos grupos.
  const [hover, setHover] = useState<HoverTarget | null>(null);

  function openManage(e: MouseEvent, clickedGroupId: string) {
    e.preventDefault();
    setManageGroupId(clickedGroupId);
  }

  function showTooltip(e: MouseEvent | FocusEvent, name: string) {
    const rect = e.currentTarget.getBoundingClientRect();
    setHover({ name, top: rect.top + rect.height / 2, left: rect.right + 10 });
  }

  return (
    <nav className={s.rail} aria-label="Grupos">
      <ul className={s.list}>
        {myGroups.map((g) => {
          const active = g.group_id === groupId;
          return (
            <li key={g.group_id} className={s.item}>
              <button
                type="button"
                className={[s.chip, active ? s.chipActive : '', g.photo_url ? s.chipPhoto : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => g.group_id !== groupId && switchGroup(g.group_id)}
                onContextMenu={(e) => openManage(e, g.group_id)}
                onDoubleClick={(e) => openManage(e, g.group_id)}
                onMouseEnter={(e) => showTooltip(e, g.name)}
                onMouseLeave={() => setHover(null)}
                onFocus={(e) => showTooltip(e, g.name)}
                onBlur={() => setHover(null)}
                aria-current={active}
              >
                {g.photo_url ? (
                  <img src={g.photo_url} alt="" className={s.chipImage} />
                ) : (
                  groupInitials(g.name)
                )}
              </button>
              {active && <span className={s.indicator} aria-hidden="true" />}
            </li>
          );
        })}
      </ul>

      <button type="button" className={s.add} onClick={() => setAddOpen(true)} title="Adicionar grupo">
        <PlusIcon width={18} height={18} />
      </button>

      {hover &&
        createPortal(
          <span
            className={s.tooltip}
            role="tooltip"
            style={{ top: hover.top, left: hover.left }}
          >
            {hover.name}
          </span>,
          document.body,
        )}

      {manageGroupId && (
        <GroupSwitcherModal groupId={manageGroupId} onClose={() => setManageGroupId(null)} />
      )}
      {addOpen && <AddGroupModal onClose={() => setAddOpen(false)} />}
    </nav>
  );
}
