import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Field, Input, Modal, Select } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/useToast';
import { AvatarUpload } from './AvatarUpload';
import { PositionPicker } from './PositionPicker';
import { togglePosition as toggle } from '../lib/positionPitch';
import { useUpdateProfile, usePositions, type FullProfile } from '../hooks/profileHooks';
import {
  profileFormSchema,
  type ProfileFormValues,
  GENDER_LABELS,
  FOOT_LABELS,
} from '../schemas/profile.schemas';
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
      username: profile.username,
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

  const selectedSecondary = form.watch('secondaryPositionIds');
  const mainPositionId = Number(form.watch('main_position_id')) || null;

  const isUsernameTaken =
    updateProfile.isError && (updateProfile.error as { code?: string })?.code === '23505';
  const usernameError = isUsernameTaken
    ? 'Esse nome de utilizador já está a ser usado.'
    : undefined;

  /** Um clique no campo mexe na principal e nas secundárias. */
  function togglePosition(id: number) {
    const next = toggle(
      { mainId: mainPositionId, secondaryIds: form.getValues('secondaryPositionIds') },
      id,
    );
    form.setValue('main_position_id', next.mainId, { shouldDirty: true });
    form.setValue('secondaryPositionIds', next.secondaryIds, { shouldDirty: true });
  }

  async function onSubmit(values: ProfileFormValues) {
    await updateProfile.mutateAsync({
      public: {
        name: values.name,
        username: values.username,
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
      secondaryPositionIds: values.secondaryPositionIds.filter(
        (id) => id !== values.main_position_id,
      ),
    });
    toast.show('Perfil guardado', 'success');
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

        <Field
          label="Nome de utilizador"
          htmlFor="username"
          hint="Único — minúsculas, números e _."
          error={form.formState.errors.username?.message ?? usernameError}
        >
          <Input id="username" placeholder="ex: vasco10" {...form.register('username')} />
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

        <fieldset className={s.positions}>
          <legend className={s.legend}>Posições</legend>
          <PositionPicker
            positions={positions ?? []}
            value={{ mainId: mainPositionId, secondaryIds: selectedSecondary }}
            onToggle={togglePosition}
          />
        </fieldset>

        {updateProfile.isError && !isUsernameTaken && (
          <Alert kind="error">Não foi possível guardar. Tenta novamente.</Alert>
        )}
      </form>
    </Modal>
  );
}
