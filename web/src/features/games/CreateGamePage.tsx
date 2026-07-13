import { useNavigate } from 'react-router-dom';
import { CreateGameForm } from './CreateGameForm';

export function CreateGamePage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-lg p-4 sm:p-6">
      <h1 className="mb-6 text-2xl font-black text-white">Criar jogo</h1>
      <CreateGameForm
        onSuccess={(id) => navigate(`/games/${id}`, { replace: true })}
        onCancel={() => navigate('/games')}
      />
    </div>
  );
}
