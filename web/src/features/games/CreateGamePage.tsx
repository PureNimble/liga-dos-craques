import { useNavigate } from 'react-router-dom';
import { CreateGameForm } from './CreateGameForm';
import s from './CreateGamePage.module.css';

export function CreateGamePage() {
  const navigate = useNavigate();
  return (
    <div className={s.page}>
      <h1 className={s.title}>Criar jogo</h1>
      <CreateGameForm
        onSuccess={(id) => navigate(`/games/${id}`, { replace: true })}
        onCancel={() => navigate('/games')}
      />
    </div>
  );
}
