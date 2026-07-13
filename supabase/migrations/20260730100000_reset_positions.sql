-- =============================================================================
-- Repor posições no campo (pos_x/pos_y)
-- =============================================================================
-- A geometria do campo mudou (cada equipa passou a ocupar o campo inteiro, com
-- nova orientação e distribuição por profundidade). As posições guardadas no
-- sistema antigo ficaram obsoletas e apareciam desalinhadas/aleatórias sobre os
-- slots das formações. Ficam a NULL para recalcularem a partir da formação real.
-- =============================================================================
update public.game_player
set pos_x = null, pos_y = null
where pos_x is not null or pos_y is not null;
