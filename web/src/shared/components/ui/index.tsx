// Barril do kit de UI partilhado. Cada primitivo vive na sua pasta
// (estrutura `.tsx` + estilos `.module.css` que referenciam os tokens).
// ConfirmProvider / useConfirm vivem em './ConfirmDialog' (importar de lá
// diretamente, para não misturar hooks com o barril — react-refresh).
export { Modal } from './Modal';
export { Button } from './Button/Button';
export { Card } from './Card/Card';
export { Badge, type BadgeTone } from './Badge/Badge';
export { Input } from './Input/Input';
export { Select } from './Select/Select';
export { Field } from './Field/Field';
export { IconButton } from './IconButton/IconButton';
export { Avatar } from './Avatar/Avatar';
export { SegmentedTabs } from './SegmentedTabs/SegmentedTabs';
export { PillTabs } from './PillTabs/PillTabs';
export { Skeleton, CardSkeleton } from './Skeleton/Skeleton';
export { Alert } from './Alert/Alert';
export { EmptyState } from './EmptyState/EmptyState';
