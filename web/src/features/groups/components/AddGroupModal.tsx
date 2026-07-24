import { Modal } from '@/shared/components/ui';
import { GroupChooser } from './GroupChooser';

/** Modal to create a group or join one (invite code or public) — no group list or settings here. */
export function AddGroupModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title="Adicionar grupo" size="lg">
      <GroupChooser onDone={onClose} />
    </Modal>
  );
}
