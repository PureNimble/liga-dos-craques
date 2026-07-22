import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { playAchievement } from './spinnerSound';
import type { IconicGoal } from './iconicGoalHooks';
import s from './AchievementToast.module.css';

/** Tempo em ecrã antes de começar a sair (ms). */
const VISIBLE_MS = 4600;
/** Duração da animação de saída (ms) — igual à do CSS. */
const EXIT_MS = 400;

interface Props {
  goal: IconicGoal;
  onDone: () => void;
}

/**
 * Conquista desbloqueada, à maneira das consolas: barra que sobe, fanfarra, e
 * o nome enigmático por cima do que foi mesmo replicado.
 */
export function AchievementToast({ goal, onDone }: Props) {
  const [leaving, setLeaving] = useState(false);

  /* Numa ref para o efeito não depender da identidade do callback: com `onDone`
     nas dependências, cada render do pai reiniciava os temporizadores e voltava
     a tocar a fanfarra. */
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    void playAchievement();
    const out = setTimeout(() => setLeaving(true), VISIBLE_MS);
    const done = setTimeout(() => onDoneRef.current(), VISIBLE_MS + EXIT_MS);
    return () => {
      clearTimeout(out);
      clearTimeout(done);
    };
  }, []);

  return createPortal(
    <div className={s.layer}>
      <div className={`${s.toast} ${leaving ? s.leaving : ''}`} role="status">
        <img
          className={s.thumb}
          src={`https://img.youtube.com/vi/${goal.youtube_id}/hqdefault.jpg`}
          alt=""
        />
        <div className={s.text}>
          <span className={s.kicker}>Conquista desbloqueada</span>
          <span className={s.name}>{goal.achievement_name ?? goal.title}</span>
          <span className={s.detail}>
            {goal.title} · {goal.scorer}
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
