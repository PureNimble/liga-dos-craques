import { useEffect, useState } from 'react';
import { Avatar, Button } from '@/shared/components/ui';
import type { SessionPlayerWithProfile } from '../../hooks/challengeHooks';
import s from './OrderReveal.module.css';

interface OrderRevealProps {
  players: SessionPlayerWithProfile[];
  onDone: () => void;
}

const SHUFFLE_MS = 1400;
const STEP_MS = 240;

/** Animates the turn-order draw: shuffles through players, then reveals the order one by one. */
export function OrderReveal({ players, onDone }: OrderRevealProps) {
  const [phase, setPhase] = useState<'shuffle' | 'reveal'>('shuffle');
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    if (phase !== 'shuffle') return;
    const tick = setInterval(() => setHighlight((h) => (h + 1) % Math.max(players.length, 1)), 90);
    const done = setTimeout(() => setPhase('reveal'), SHUFFLE_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, [phase, players.length]);

  if (phase === 'shuffle') {
    const p = players[highlight % Math.max(players.length, 1)];
    return (
      <div className={s.wrap}>
        <p className={s.title}>A sortear a ordem…</p>
        <div className={s.shuffleCard}>
          <Avatar name={p?.profile?.name} src={p?.profile?.photo_url} size="lg" />
          <span className={s.shuffleName}>{p?.profile?.name ?? '—'}</span>
        </div>
      </div>
    );
  }

  const revealMs = players.length * STEP_MS + 300;
  return (
    <div className={s.wrap}>
      <p className={s.title}>Ordem sorteada</p>
      <ul className={s.list}>
        {players.map((p, i) => (
          <li key={p.id} className={s.item} style={{ animationDelay: `${i * STEP_MS}ms` }}>
            <span className={s.ordinal}>{i + 1}º</span>
            <Avatar name={p.profile?.name} src={p.profile?.photo_url} size="sm" />
            <span className={s.name}>{p.profile?.name ?? 'Jogador'}</span>
          </li>
        ))}
      </ul>
      <RevealAction delay={revealMs} onDone={onDone} />
    </div>
  );
}

function RevealAction({ delay, onDone }: { delay: number; onDone: () => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <Button block size="lg" onClick={onDone} disabled={!ready} className={ready ? s.ctaIn : ''}>
      Começar jogo
    </Button>
  );
}
