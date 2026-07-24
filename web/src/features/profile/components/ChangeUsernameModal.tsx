import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Field, Input, Modal } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/useToast';
import { useUpdateUsername } from '../hooks/profileHooks';
import { USERNAME_REGEX } from '../schemas/profile.schemas';

const usernameFormSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(USERNAME_REGEX, 'Só minúsculas, números e _ (3-20 carateres)'),
});
type UsernameFormValues = z.infer<typeof usernameFormSchema>;

interface ChangeUsernameModalProps {
  open: boolean;
  currentUsername: string;
  onClose: () => void;
}

/** Modal focused solely on changing the username (Settings > Account). */
export function ChangeUsernameModal({ open, currentUsername, onClose }: ChangeUsernameModalProps) {
  const updateUsername = useUpdateUsername();
  const toast = useToast();
  const form = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameFormSchema),
    defaultValues: { username: currentUsername },
  });

  const isTaken =
    updateUsername.isError && (updateUsername.error as { code?: string })?.code === '23505';
  const usernameError = isTaken ? 'Esse nome de utilizador já está a ser usado.' : undefined;

  async function onSubmit(values: UsernameFormValues) {
    await updateUsername.mutateAsync(values.username);
    toast.show('Nome de utilizador atualizado', 'success');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mudar nome de utilizador"
      variant="sheet"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            loading={form.formState.isSubmitting || updateUsername.isPending}
          >
            Guardar
          </Button>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Field
          label="Nome de utilizador"
          htmlFor="username"
          hint="Único - minúsculas, números e _."
          error={form.formState.errors.username?.message ?? usernameError}
        >
          <Input id="username" {...form.register('username')} />
        </Field>
      </form>
    </Modal>
  );
}
