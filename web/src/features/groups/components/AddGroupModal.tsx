import { Modal } from '@/shared/components/ui';
import { GroupChooser } from './GroupChooser';

/**
 * Só isto: aceitar um convite, criar um grupo, ou entrar num (código ou
 * público). Sem lista de "os teus grupos" nem definições — isso já vive na
 * coluna de grupos e no modal de gestão do grupo ativo, respetivamente.
 */
export function AddGroupModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title="Adicionar grupo" size="lg">
      <GroupChooser onDone={onClose} />
    </Modal>
  );
}
