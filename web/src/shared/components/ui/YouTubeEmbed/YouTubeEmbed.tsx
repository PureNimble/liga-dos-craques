import s from './YouTubeEmbed.module.css';

interface YouTubeEmbedProps {
  videoId: string;
  title: string;
  /** Segundo em que o vídeo arranca. */
  start?: number;
  /** false = o dono bloqueia o embed; mostra miniatura + link em vez do leitor. */
  embeddable?: boolean;
}

/** Leitor de YouTube responsivo (16:9), sem cookies e sem dependências. */
export function YouTubeEmbed({ videoId, title, start = 0, embeddable = true }: YouTubeEmbedProps) {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}${start > 0 ? `&t=${start}` : ''}`;

  if (!embeddable) {
    return (
      <a className={s.facade} href={watchUrl} target="_blank" rel="noreferrer" title={title}>
        <img
          className={s.thumb}
          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
          alt={title}
          loading="lazy"
        />
        <span className={s.playBtn} aria-hidden>
          <span className={s.triangle} />
        </span>
        <span className={s.watchTag}>Ver no YouTube</span>
      </a>
    );
  }

  const params = new URLSearchParams({ rel: '0' });
  if (start > 0) params.set('start', String(start));

  return (
    <div>
      <div className={s.wrap}>
        <iframe
          className={s.frame}
          src={`https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <a className={s.watchLink} href={watchUrl} target="_blank" rel="noreferrer">
        Ver no YouTube
      </a>
    </div>
  );
}
