import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Field, Input, Modal, Select } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/useToast';
import { AvatarUpload } from './AvatarUpload';
import { useUpdateProfile, usePositions, type FullProfile } from './profileHooks';
import {
  profileFormSchema,
  type ProfileFormValues,
  GENDER_LABELS,
  FOOT_LABELS,
} from './profile.schemas';
import s from './ProfileEditModal.module.css';

interface ProfileEditModalProps {
  profile: FullProfile;
  onClose: () => void;
}

export function ProfileEditModal({ profile, onClose }: ProfileEditModalProps) {
  const { data: positions } = usePositions();
  const updateProfile = useUpdateProfile();
  const toast = useToast();
  const [photoUrl, setPhotoUrl] = useState<string | null>(profile.photo_url);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile.name,
      birth_date: profile.birth_date,
      weight_kg: profile.weight_kg,
      height_cm: profile.height_cm,
      gender: profile.gender,
      locality: profile.locality,
      preferred_foot: profile.preferred_foot,
      main_position_id: profile.main_position_id,
      secondaryPositionIds: profile.secondaryPositionIds,
    },
  });

  // Espera pelas posições para o <select> "engatar" o valor guardado.
  useEffect(() => {
    if (positions) form.setValue('main_position_id', profile.main_position_id);
  }, [positions, profile.main_position_id, form]);

  const selectedSecondary = form.watch('secondaryPositionIds');
  const mainPositionId = Number(form.watch('main_position_id')) || null;

  function toggleSecondary(id: number) {
    const current = form.getValues('secondaryPositionIds');
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    form.setValue('secondaryPositionIds', next, { shouldDirty: true });
  }

  async function onSubmit(values: ProfileFormValues) {
    await updateProfile.mutateAsync({
      public: {
        name: values.name,
        photo_url: photoUrl,
        gender: values.gender,
        locality: values.locality,
        preferred_foot: values.preferred_foot,
        main_position_id: values.main_position_id,
      },
      private: {
        birth_date: values.birth_date,
        weight_kg: values.weight_kg,
        height_cm: values.height_cm,
      },
      secondaryPositionIds: values.secondaryPositionIds.filter((id) => id !== values.main_position_id),
    });
    toast.show('Perfil guardado ✓', 'success');
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      variant="sheet"
      size="lg"
      title="Editar perfil"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            loading={form.formState.isSubmitting || updateProfile.isPending}
          >
            Guardar
          </Button>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className={s.form}>
        <div className={s.avatarCenter}>
          <AvatarUpload photoUrl={photoUrl} name={profile.name} onUploaded={setPhotoUrl} />
        </div>

        <Field label="Nome" htmlFor="name" error={form.formState.errors.name?.message}>
          <Input id="name" {...form.register('name')} />
        </Field>

        <div className={s.grid2}>
          <Field label="Data de nascimento" htmlFor="birth_date" hint="Visível só para ti">
            <Input id="birth_date" type="date" {...form.register('birth_date')} />
          </Field>
          <Field label="Localidade" htmlFor="locality">
            <Input id="locality" {...form.register('locality')} />
          </Field>
        </div>

        <div className={s.grid2}>
          <Field
            label="Peso (kg)"
            htmlFor="weight_kg"
            hint="Visível só para ti"
            error={form.formState.errors.weight_kg?.message}
          >
            <Input id="weight_kg" type="number" step="0.1" {...form.register('weight_kg')} />
          </Field>
          <Field
            label="Altura (cm)"
            htmlFor="height_cm"
            hint="Visível só para ti"
            error={form.formState.errors.height_cm?.message}
          >
            <Input id="height_cm" type="number" {...form.register('height_cm')} />
          </Field>
        </div>

        <div className={s.grid2}>
          <Field label="Género" htmlFor="gender">
            <Select id="gender" {...form.register('gender')}>
              <option value="">—</option>
              {Object.entries(GENDER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Pé preferido" htmlFor="preferred_foot">
            <Select id="preferred_foot" {...form.register('preferred_foot')}>
              <option value="">—</option>
              {Object.entries(FOOT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Posição principal" htmlFor="main_position_id">
          <Select id="main_position_id" {...form.register('main_position_id')}>
            <option value="">—</option>
            {positions?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </Field>

        <fieldset>
          <legend className={s.legend}>Posições secundárias</legend>
          <div className={s.chips}>
            {positions
              ?.filter((p) => p.id !== mainPositionId)
              .map((p) => {
                const active = selectedSecondary.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleSecondary(p.id)}
                    className={`${s.chip} ${active ? s.chipActive : ''}`}
                  >
                    {p.label}
                  </button>
                );
              })}
          </div>
        </fieldset>

        {updateProfile.isError && (
          <Alert kind="error">Não foi possível guardar. Tenta novamente.</Alert>
        )}
      </form>
    </Modal>
  );
}
