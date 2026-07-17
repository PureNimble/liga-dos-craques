import {
  Children,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon, CheckIcon } from '../icons';
import s from './Select.module.css';

interface SelectOption {
  value: string;
  label: string;
  disabled: boolean;
}

interface OptionElementProps {
  value?: string | number;
  children?: ReactNode;
  disabled?: boolean;
}

/** Achata `<option>`/`<optgroup>` para a lista usada no popup customizado. */
function collectOptions(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = [];
  const walk = (nodes: ReactNode) => {
    Children.forEach(nodes, (node) => {
      if (!isValidElement(node)) return;
      const element = node as ReactElement<OptionElementProps>;
      if (element.type === 'option') {
        const { value, children: optionChildren, disabled } = element.props;
        const label =
          typeof optionChildren === 'string' || typeof optionChildren === 'number'
            ? String(optionChildren)
            : Children.toArray(optionChildren).map(String).join('');
        options.push({
          value: value === undefined ? '' : String(value),
          label,
          disabled: Boolean(disabled),
        });
        return;
      }
      const nested = element.props.children;
      if (nested) walk(nested);
    });
  };
  walk(children);
  return options;
}

interface PopupPosition {
  left: number;
  width: number;
  top: number;
  bottom: number;
  above: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = '', children, id, disabled, ...selectProps }, forwardedRef) {
    const options = useMemo(() => collectOptions(children), [children]);
    const baseId = useId();

    const hiddenRef = useRef<HTMLSelectElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const popupRef = useRef<HTMLUListElement | null>(null);
    const typeAheadRef = useRef({
      text: '',
      timer: undefined as ReturnType<typeof setTimeout> | undefined,
    });

    const [uncontrolledValue, setUncontrolledValue] = useState('');
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(0);
    const [position, setPosition] = useState<PopupPosition | null>(null);

    const setHiddenRef = useCallback(
      (node: HTMLSelectElement | null) => {
        hiddenRef.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    // Sem `value`, é o modo do register()/defaultValue do react-hook-form: o valor
    // real só existe no DOM (escrito pelo ref), por isso lemos de lá. Com `value`,
    // o chamador controla-o — usamo-lo diretamente, nunca o DOM (que o React
    // repõe ao valor controlado assim que o evento de change termina).
    const isControlled = selectProps.value !== undefined;

    useLayoutEffect(() => {
      if (!isControlled) setUncontrolledValue(hiddenRef.current?.value ?? '');
    }, [isControlled, options]);

    const displayValue = isControlled ? String(selectProps.value) : uncontrolledValue;
    const selectedOption = options.find((o) => o.value === displayValue);

    function computePosition(): PopupPosition | null {
      const trigger = triggerRef.current;
      if (!trigger) return null;
      const rect = trigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const estimatedHeight = Math.min(320, options.length * 36 + 8);
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const above = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
      return {
        left: rect.left,
        width: rect.width,
        top: rect.bottom,
        bottom: viewportHeight - rect.top,
        above,
      };
    }

    function closePopup() {
      setOpen(false);
      triggerRef.current?.focus();
    }

    function commitValue(nextValue: string) {
      const el = hiddenRef.current;
      if (!el) return;
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        'value',
      )?.set;
      nativeSetter?.call(el, nextValue);
      // Despacha o change nativo para o onChange do chamador (controlado ou register())
      // disparar normalmente — o React repõe o valor da prop `value` logo a seguir se o
      // chamador não atualizar o seu estado, por isso não relemos do DOM aqui.
      el.dispatchEvent(new Event('change', { bubbles: true }));
      if (!isControlled) setUncontrolledValue(nextValue);
    }

    function openPopup() {
      const pos = computePosition();
      if (!pos) return;
      setPosition(pos);
      const currentIndex = options.findIndex((o) => o.value === displayValue);
      const fallbackIndex = options.findIndex((o) => !o.disabled);
      setHighlighted(currentIndex >= 0 ? currentIndex : Math.max(0, fallbackIndex));
      setOpen(true);
    }

    function moveHighlight(delta: number) {
      setHighlighted((current) => {
        const total = options.length;
        if (total === 0) return current;
        let next = current;
        for (let i = 0; i < total; i++) {
          next = (next + delta + total) % total;
          if (!options[next].disabled) return next;
        }
        return current;
      });
    }

    function jumpToEdge(edge: 'first' | 'last') {
      const indexes = options.map((_, i) => i);
      const ordered = edge === 'first' ? indexes : [...indexes].reverse();
      const found = ordered.find((i) => !options[i].disabled);
      if (found !== undefined) setHighlighted(found);
    }

    function selectHighlighted() {
      const option = options[highlighted];
      if (!option || option.disabled) return;
      commitValue(option.value);
      closePopup();
    }

    function typeAhead(char: string) {
      const state = typeAheadRef.current;
      clearTimeout(state.timer);
      state.text += char.toLowerCase();
      const total = options.length;
      for (let offset = 0; offset <= total; offset++) {
        const index = (highlighted + offset) % total;
        if (!options[index].disabled && options[index].label.toLowerCase().startsWith(state.text)) {
          setHighlighted(index);
          break;
        }
      }
      state.timer = setTimeout(() => {
        state.text = '';
      }, 700);
    }

    function handleTriggerKeyDown(e: ReactKeyboardEvent<HTMLButtonElement>) {
      if (!open) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPopup();
        }
        return;
      }
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          moveHighlight(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveHighlight(-1);
          break;
        case 'Home':
          e.preventDefault();
          jumpToEdge('first');
          break;
        case 'End':
          e.preventDefault();
          jumpToEdge('last');
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          selectHighlighted();
          break;
        case 'Escape':
          e.preventDefault();
          closePopup();
          break;
        case 'Tab':
          setOpen(false);
          break;
        default:
          if (e.key.length === 1) {
            e.preventDefault();
            typeAhead(e.key);
          }
      }
    }

    useEffect(() => {
      if (!open) return;
      function handlePointerDown(e: MouseEvent) {
        const target = e.target as Node;
        if (triggerRef.current?.contains(target) || popupRef.current?.contains(target)) return;
        setOpen(false);
      }
      function handleScroll(e: Event) {
        // Ignora o scroll interno do próprio popup (overflow-y: auto da lista) —
        // só fecha quando o scroll é de um antepassado (página, modal, etc.).
        if (popupRef.current?.contains(e.target as Node)) return;
        setOpen(false);
      }
      function handleResize() {
        setPosition(computePosition());
      }
      document.addEventListener('mousedown', handlePointerDown);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        document.removeEventListener('mousedown', handlePointerDown);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const listboxId = `${baseId}-listbox`;
    const activeOptionId =
      open && options[highlighted] ? `${baseId}-option-${highlighted}` : undefined;

    return (
      <div className={s.wrapper}>
        <select
          {...selectProps}
          ref={setHiddenRef}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden
          className={s.hidden}
        >
          {children}
        </select>

        <button
          type="button"
          id={id}
          ref={triggerRef}
          disabled={disabled}
          className={[s.control, className].filter(Boolean).join(' ')}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          onClick={() => (open ? closePopup() : openPopup())}
          onKeyDown={handleTriggerKeyDown}
          onBlur={(e) => selectProps.onBlur?.(e as unknown as ReactFocusEvent<HTMLSelectElement>)}
        >
          <span className={selectedOption ? s.value : s.placeholder}>
            {selectedOption?.label ?? ''}
          </span>
          <ChevronDownIcon
            className={[s.chevron, open ? s.chevronOpen : ''].filter(Boolean).join(' ')}
            width={16}
            height={16}
          />
        </button>

        {open &&
          position &&
          createPortal(
            <ul
              ref={popupRef}
              id={listboxId}
              role="listbox"
              className={s.popup}
              style={{
                left: position.left,
                width: position.width,
                ...(position.above ? { bottom: position.bottom } : { top: position.top }),
                transformOrigin: position.above ? 'bottom' : 'top',
              }}
            >
              {options.map((option, index) => (
                <li
                  key={option.value}
                  id={`${baseId}-option-${index}`}
                  role="option"
                  aria-selected={option.value === displayValue}
                  aria-disabled={option.disabled || undefined}
                  className={[
                    s.option,
                    index === highlighted ? s.optionHighlighted : '',
                    option.value === displayValue ? s.optionSelected : '',
                    option.disabled ? s.optionDisabled : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onMouseEnter={() => !option.disabled && setHighlighted(index)}
                  onClick={() => {
                    if (option.disabled) return;
                    commitValue(option.value);
                    closePopup();
                  }}
                >
                  <span>{option.label}</span>
                  {option.value === displayValue && (
                    <CheckIcon className={s.check} width={16} height={16} />
                  )}
                </li>
              ))}
            </ul>,
            document.body,
          )}
      </div>
    );
  },
);
