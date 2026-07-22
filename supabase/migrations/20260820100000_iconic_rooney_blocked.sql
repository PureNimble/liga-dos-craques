-- Golo do Rooney (footage da Premier League) bloqueia reprodução embutida:
-- passa a mostrar miniatura + link para o YouTube (coluna iconic_goal.embeddable).
update public.iconic_goal set embeddable = false where code = 'ig_rooney';
