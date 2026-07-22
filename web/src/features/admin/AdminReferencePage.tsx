import { useState } from 'react';
import { Button, Card, Field, Input, Modal } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/useToast';
import {
  useReferenceGroups,
  useUpdateReference,
  type RefGroup,
  type RefRow,
  type ReferenceTable,
} from './referenceHooks';
import cards from './adminCards.module.css';
import s from './AdminReferencePage.module.css';

interface EditTarget {
  table: ReferenceTable;
  row: RefRow;
}

export function AdminReferencePage() {
  const { data: groups, isLoading } = useReferenceGroups();
  const [editing, setEditing] = useState<EditTarget | null>(null);

  return (
    <>
      <p className={s.intro}>
        Renomear e reordenar as tabelas de referência. Os campos estruturais (jogadores por lado,
        categoria, se conta para o resultado…) alteram a lógica do jogo e continuam a viver em
        migrações.
      </p>

      {isLoading ? (
        <p className={s.muted}>A carregar…</p>
      ) : (
        groups?.map((g) => (
          <ReferenceCard
            key={g.table}
            group={g}
            onEdit={(row) => setEditing({ table: g.table, row })}
          />
        ))
      )}

      {editing && (
        <EditModal table={editing.table} row={editing.row} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

function ReferenceCard({ group, onEdit }: { group: RefGroup; onEdit: (row: RefRow) => void }) {
  return (
    <Card>
      <h2 className={cards.cardTitle}>{group.title}</h2>
      <ul className={s.list}>
        {group.rows.map((row) => (
          <li key={row.id} className={s.row}>
            <span className={s.order}>{row.sort_order}</span>
            <div className={s.rowText}>
              <span className={s.rowLabel}>{row.label}</span>
              <span className={s.rowMeta}>
                <code className={s.code}>{row.code}</code>
                {row.detail && ` · ${row.detail}`}
              </span>
            </div>
            <Button size="sm" variant="secondary" onClick={() => onEdit(row)}>
              Editar
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function EditModal({
  table,
  row,
  onClose,
}: {
  table: ReferenceTable;
  row: RefRow;
  onClose: () => void;
}) {
  const update = useUpdateReference();
  const toast = useToast();
  const [label, setLabel] = useState(row.label);
  const [sortOrder, setSortOrder] = useState(String(row.sort_order));

  async function save() {
    const name = label.trim();
    if (!name) return;
    try {
      await update.mutateAsync({ table, id: row.id, label: name, sort_order: Number(sortOrder) });
      toast.show('Guardado.', 'success');
      onClose();
    } catch {
      toast.show('Não foi possível guardar.', 'error');
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Editar · ${row.code}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} loading={update.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <div className={s.form}>
        <Field label="Rótulo" htmlFor="ref-label">
          <Input id="ref-label" value={label} onChange={(e) => setLabel(e.target.value)} />
        </Field>
        <Field label="Ordem" htmlFor="ref-order" hint="Menor aparece primeiro">
          <Input
            id="ref-order"
            type="number"
            inputMode="numeric"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
