import { describe, expect, it } from 'vitest';
import { buildGoalCode, extractYouTubeId, iconicGoalSchema } from './iconicGoal.schemas';

describe('extractYouTubeId', () => {
  it('aceita um ID de 11 caracteres', () => {
    expect(extractYouTubeId('6rX1oIL2l_U')).toBe('6rX1oIL2l_U');
  });
  it('extrai de vários formatos de URL', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=6rX1oIL2l_U')).toBe('6rX1oIL2l_U');
    expect(extractYouTubeId('https://youtu.be/6rX1oIL2l_U?t=30')).toBe('6rX1oIL2l_U');
    expect(extractYouTubeId('https://www.youtube.com/embed/6rX1oIL2l_U')).toBe('6rX1oIL2l_U');
    expect(extractYouTubeId('https://youtube.com/shorts/6rX1oIL2l_U')).toBe('6rX1oIL2l_U');
  });
  it('rejeita lixo', () => {
    expect(extractYouTubeId('não é um vídeo')).toBeNull();
    expect(extractYouTubeId('')).toBeNull();
  });
});

describe('buildGoalCode', () => {
  it('slugifica jogador e título e junta sufixo único', () => {
    const code = buildGoalCode('Cristiano Ronaldo', 'Míssil vs Porto');
    expect(code).toMatch(/^ig_cristiano_ronaldo_missil_vs_porto_[a-z0-9]+$/);
  });
  it('dá códigos diferentes para a mesma entrada', () => {
    expect(buildGoalCode('A', 'B')).not.toBe(buildGoalCode('A', 'B'));
  });
});

describe('iconicGoalSchema', () => {
  const valid = {
    scorer: 'Zidane',
    title: 'Voleio',
    youtube_id: 'https://youtu.be/rFfomw-Z4uE',
    difficulty: '5',
    embeddable: true,
  };

  it('valida e normaliza o youtube_id e o ano vazio', () => {
    const out = iconicGoalSchema.parse({ ...valid, year: '' });
    expect(out.youtube_id).toBe('rFfomw-Z4uE');
    expect(out.year).toBeUndefined();
    expect(out.difficulty).toBe(5);
    expect(out.video_start).toBe(0);
  });

  it('rejeita um vídeo inválido', () => {
    expect(() => iconicGoalSchema.parse({ ...valid, youtube_id: 'xxx' })).toThrow();
  });

  it('trata o nome de conquista vazio como null', () => {
    const out = iconicGoalSchema.parse({ ...valid, achievement_name: '   ' });
    expect(out.achievement_name).toBeNull();
  });
});
