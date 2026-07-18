import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Field, Input, Modal, Select } from '@/shared/components/ui';
import { useCreatePlace, type Place } from './placeHooks';
import { createPlaceSchema, CONCELHOS_BY_DISTRICT, DISTRICTS, type CreatePlaceValues } from './place.schemas';
import s from './AddPlaceModal.module.css';

interface AddPlaceModalProps {
  onClose: () => void;
  /** Distrito pré-selecionado (ex.: quando aberto a partir de um distrito já escolhido no mapa). */
  defaultDistrict?: string;
  /** Nome pré-preenchido (ex.: o texto já escrito noutro formulário ao abrir este modal). */
  defaultName?: string;
  /** Chamado com o campo criado, antes de fechar (ex.: para o auto-selecionar noutro formulário). */
  onCreated?: (place: Place) => void;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    county?: string;
    state?: string;
    city?: string;
    town?: string;
    municipality?: string;
    village?: string;
  };
}

/**
 * O Nominatim não tem um campo fixo para "concelho" — consoante o tipo/escala
 * do local, o nome aparece em city/town/municipality/village. Tenta cada um,
 * por ordem, e aceita o primeiro que corresponda a um concelho real do distrito.
 */
function matchConcelho(district: string, address: NominatimResult['address']): string | undefined {
  if (!address) return undefined;
  const validConcelhos = CONCELHOS_BY_DISTRICT[district] ?? [];
  const candidates = [address.city, address.town, address.municipality, address.village];
  return candidates.find((c): c is string => c !== undefined && validConcelhos.includes(c));
}

export function AddPlaceModal({ onClose, defaultDistrict, defaultName, onCreated }: AddPlaceModalProps) {
  const createPlace = useCreatePlace();
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [noResults, setNoResults] = useState(false);
  const [candidates, setCandidates] = useState<NominatimResult[]>([]);
  const [districtWarning, setDistrictWarning] = useState<string | null>(null);

  const initialDistrict = (defaultDistrict as CreatePlaceValues['district']) || DISTRICTS[0];
  const form = useForm<CreatePlaceValues>({
    resolver: zodResolver(createPlaceSchema),
    defaultValues: {
      name: defaultName ?? '',
      district: initialDistrict,
      concelho: CONCELHOS_BY_DISTRICT[initialDistrict]?.[0] ?? '',
    },
  });

  const selectedDistrict = form.watch('district');
  const concelhoOptions = CONCELHOS_BY_DISTRICT[selectedDistrict] ?? [];

  // Sempre que o distrito muda, o concelho anterior pode já não pertencer a
  // este — repõe para o primeiro concelho válido da nova lista.
  useEffect(() => {
    const current = form.getValues('concelho');
    if (!concelhoOptions.includes(current)) {
      form.setValue('concelho', concelhoOptions[0] ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrict]);

  async function handleSearch() {
    const query = form.getValues('name').trim();
    if (!query) return;
    setSearching(true);
    setSearchError(null);
    setNoResults(false);
    setCandidates([]);
    setDistrictWarning(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=3&countrycodes=pt&q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Falha na pesquisa');
      const results: NominatimResult[] = await res.json();
      if (results.length === 0) {
        setNoResults(true);
        return;
      }
      setCandidates(results);
    } catch {
      setSearchError('Não foi possível pesquisar. Tenta novamente.');
    } finally {
      setSearching(false);
    }
  }

  function applyCandidate(result: NominatimResult) {
    form.setValue('latitude', Number(result.lat), { shouldValidate: true });
    form.setValue('longitude', Number(result.lon), { shouldValidate: true });
    const rawDistrict = result.address?.county ?? result.address?.state;
    const matchedDistrict = DISTRICTS.find((d) => d === rawDistrict);
    if (matchedDistrict) {
      form.setValue('district', matchedDistrict, { shouldValidate: true });
      const matchedConcelho = matchConcelho(matchedDistrict, result.address);
      if (matchedConcelho) {
        form.setValue('concelho', matchedConcelho, { shouldValidate: true });
        setDistrictWarning(null);
      } else {
        setDistrictWarning('Não foi possível identificar o concelho automaticamente — confirma antes de guardar.');
      }
    } else {
      setDistrictWarning('Não foi possível identificar o distrito automaticamente — confirma antes de guardar.');
    }
    setCandidates([]);
  }

  async function onSubmit(values: CreatePlaceValues) {
    const created = await createPlace.mutateAsync(values);
    onCreated?.(created);
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Adicionar campo"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} loading={form.formState.isSubmitting || createPlace.isPending}>
            Adicionar
          </Button>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className={s.form}>
        <Field label="Nome" htmlFor="name" error={form.formState.errors.name?.message}>
          <div className={s.searchRow}>
            <Input id="name" placeholder="Ex.: Campo Municipal" {...form.register('name')} />
            <Button type="button" variant="secondary" onClick={handleSearch} loading={searching}>
              Pesquisar
            </Button>
          </div>
        </Field>

        {searchError && <Alert kind="error">{searchError}</Alert>}

        {noResults && (
          <Alert kind="info">Campo não encontrado — preenche a localização manualmente abaixo.</Alert>
        )}

        {districtWarning && <Alert kind="info">{districtWarning}</Alert>}

        {candidates.length > 0 && (
          <ul className={s.candidates}>
            {candidates.map((c, i) => (
              <li key={i}>
                <button type="button" className={s.candidate} onClick={() => applyCandidate(c)}>
                  {c.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={s.grid2}>
          <Field label="Distrito" htmlFor="district" error={form.formState.errors.district?.message}>
            <Select id="district" {...form.register('district')}>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Concelho" htmlFor="concelho" error={form.formState.errors.concelho?.message}>
            <Select id="concelho" {...form.register('concelho')}>
              {concelhoOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className={s.grid2}>
          <Field label="Latitude" htmlFor="latitude" error={form.formState.errors.latitude?.message}>
            <Input id="latitude" type="number" step="any" placeholder="Ex.: 38.7169" {...form.register('latitude')} />
          </Field>
          <Field label="Longitude" htmlFor="longitude" error={form.formState.errors.longitude?.message}>
            <Input id="longitude" type="number" step="any" placeholder="Ex.: -9.1399" {...form.register('longitude')} />
          </Field>
        </div>

        <Field
          label="Website / Google Maps"
          htmlFor="url"
          hint="Opcional"
          error={form.formState.errors.url?.message}
        >
          <Input id="url" placeholder="https://…" {...form.register('url')} />
        </Field>

        <Field label="Telefone" htmlFor="phone" hint="Opcional" error={form.formState.errors.phone?.message}>
          <Input id="phone" placeholder="Ex.: 912 345 678" {...form.register('phone')} />
        </Field>

        {createPlace.isError && <Alert kind="error">Não foi possível guardar o campo.</Alert>}
      </form>
    </Modal>
  );
}
