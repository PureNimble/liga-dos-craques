import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './Select';

function positionOptions() {
  return (
    <>
      <option value="">Escolher…</option>
      <option value="gk">Guarda-redes</option>
      <option value="def">Defesa</option>
      <option value="atk" disabled>
        Avançado
      </option>
    </>
  );
}

describe('Select', () => {
  it('mostra a opção selecionada (controlado) e chama onChange ao escolher outra', () => {
    let received = '';
    const onChange = vi.fn((e) => {
      received = e.target.value;
    });
    render(
      <Select value="gk" onChange={onChange}>
        {positionOptions()}
      </Select>,
    );

    expect(screen.getByRole('combobox')).toHaveTextContent('Guarda-redes');

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Defesa' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(received).toBe('def');
  });

  it('ignora cliques em opções disabled', () => {
    const onChange = vi.fn();
    render(
      <Select value="gk" onChange={onChange}>
        {positionOptions()}
      </Select>,
    );

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Avançado' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('navega e escolhe por teclado (ArrowDown + Enter)', () => {
    let received = '';
    const onChange = vi.fn((e) => {
      received = e.target.value;
    });
    render(
      <Select value="gk" onChange={onChange}>
        {positionOptions()}
      </Select>,
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(received).toBe('def');
  });

  it('reflete a nova prop `value` quando o pai atualiza o estado (round-trip controlado)', () => {
    function ControlledHarness() {
      const [value, setValue] = useState('gk');
      return (
        <Select value={value} onChange={(e) => setValue(e.target.value)}>
          {positionOptions()}
        </Select>
      );
    }
    render(<ControlledHarness />);

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Defesa' }));

    expect(screen.getByRole('combobox')).toHaveTextContent('Defesa');
  });

  it('Escape fecha sem alterar o valor', () => {
    const onChange = vi.fn();
    render(
      <Select value="gk" onChange={onChange}>
        {positionOptions()}
      </Select>,
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('funciona com react-hook-form register(), refletindo defaultValues', () => {
    function Form() {
      const { register } = useForm({ defaultValues: { position: 'def' } });
      return <Select {...register('position')}>{positionOptions()}</Select>;
    }
    render(<Form />);

    expect(screen.getByRole('combobox')).toHaveTextContent('Defesa');
  });
});
