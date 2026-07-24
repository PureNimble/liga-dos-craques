-- A "Defesa" deixa de suportar tags.
--
-- As tags existentes são todas de TÉCNICA DE GOLO (bicicleta, cabeceamento,
-- pé esquerdo/direito, voleio, remate de longe) - não fazem sentido numa defesa.
-- Antes, como `save.supports_tags = true`, o modal da defesa mostrava estas tags
-- de golo. Os golos (`event_type` 'goal', que continua com supports_tags = true)
-- passam a expor o seletor de tags na UI (GoalModal).
update public.event_type set supports_tags = false where code = 'save';
