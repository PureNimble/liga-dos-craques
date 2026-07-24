import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { playAchievement } from '../../lib/iconic/spinnerSound';
import type { IconicGoal } from '../../hooks/iconic/iconicGoalHooks';
import s from './AchievementToast.module.css';

const VISIBLE_MS = 4600;
const EXIT_MS = 400;

interface Props {
  goal: IconicGoal;
  onDone: () => void;
}

/** Console-style achievement toast: rising thumbnail card with fanfare and the unlocked goal's name. */
export function AchievementToast({ goal, onDone }: Props) {
  const [leaving, setLeaving] = useState(false);

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
