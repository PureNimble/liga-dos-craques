import { z } from 'zod';

/** Extrai o ID de 11 caracteres de um URL do YouTube (ou devolve o próprio ID). */
export function extractYouTubeId(input: string): string | null {
  const raw = input.trim();
  if (/^[\w-]{11}$/.test(raw)) return raw;
  const patterns = [
    /[?&]v=([\w-]{11})/, // watch?v=ID
    /youtu\.be\/([\w-]{11})/, // youtu.be/ID
    /\/(?:embed|shorts)\/([\w-]{11})/, // /embed/ID · /shorts/ID
  ];
  for (const re of patterns) {
    const m = raw.match(re);
    if (m) return m[1];
  }
  return null;
}

/** Slug ASCII simples para compor o `code` a partir do jogador/título. */
function slug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // tira acentos (combining marks)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

/** `code` único para golos criados pela app (os de migração usam `ig_<nome>`). */
export function buildGoalCode(scorer: string, title: string): string {
  const base = [slug(scorer), slug(title)].filter(Boolean).join('_') || 'golo';
  return `ig_${base}_${Math.random().toString(36).slice(2, 7)}`;
}

const currentYear = new Date().getFullYear();

export const iconicGoalSchema = z.object({
  scorer: z.string().trim().min(1, 'Indica o jogador').max(80),
  title: z.string().trim().min(1, 'Indica o título do golo').max(120),
  achievement_name: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => v || null),
  youtube_id: z
    .string()
    .trim()
    .min(1, 'Indica o vídeo')
    .transform((v, ctx) => {
      const id = extractYouTubeId(v);
      if (!id) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'URL ou ID do YouTube inválido' });
        return z.NEVER;
      }
      return id;
    }),
  year: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z
      .number()
      .int()
      .min(1900, 'Ano inválido')
      .max(currentYear + 1, 'Ano inválido')
      .optional(),
  ),
  difficulty: z.coerce.number().int().min(1).max(5),
  video_start: z.coerce.number().int().min(0).default(0),
  embeddable: z.boolean().default(true),
});

export type IconicGoalValues = z.infer<typeof iconicGoalSchema>;
