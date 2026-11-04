import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../test/axe';
import { PromptInput, type PromptInputProps } from './PromptInput';

function setup(props: Partial<PromptInputProps> = {}) {
  const onSubmit = vi.fn();
  const onStop = vi.fn();
  const user = userEvent.setup();
  const view = render(
    <PromptInput label="Message" onSubmit={onSubmit} onStop={onStop} {...props} />,
  );
  const field = screen.getByRole('textbox', { name: 'Message' });
  return { ...view, user, field, onSubmit, onStop };
}

describe('PromptInput', () => {
  it('sends on Enter and clears the field', async () => {
    const { user, field, onSubmit } = setup();

    await user.type(field, 'Hello{Enter}');

    expect(onSubmit).toHaveBeenCalledWith('Hello');
    expect(field).toHaveValue('');
    expect(field).toHaveFocus();
  });

  it('inserts a newline on Shift+Enter', async () => {
    const { user, field, onSubmit } = setup();

    await user.type(field, 'Line one{Shift>}{Enter}{/Shift}Line two');

    expect(onSubmit).not.toHaveBeenCalled();
    expect(field).toHaveValue('Line one\nLine two');
  });

  it('does not send while an IME composition is active', () => {
    const { field, onSubmit } = setup({ defaultValue: 'こんにちは' });

    fireEvent.keyDown(field, { key: 'Enter', isComposing: true });
    fireEvent.keyDown(field, { key: 'Enter', keyCode: 229 });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('ignores empty and whitespace-only messages', async () => {
    const { user, field, onSubmit } = setup();
    const send = screen.getByRole('button', { name: 'Send message' });

    expect(send).toHaveAttribute('aria-disabled', 'true');
    await user.type(field, '   {Enter}');
    await user.click(send);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('sends with the button and keeps it focusable when unavailable', async () => {
    const { user, field, onSubmit } = setup();
    const send = screen.getByRole('button', { name: 'Send message' });

    await user.tab();
    await user.tab();
    expect(send).toHaveFocus();

    await user.type(field, 'Via button');
    expect(send).not.toHaveAttribute('aria-disabled');
    await user.click(send);
    expect(onSubmit).toHaveBeenCalledWith('Via button');
  });

  it('turns into a stop button while streaming', async () => {
    const { user, onStop, onSubmit } = setup({ streaming: true, defaultValue: 'Draft' });

    await user.click(screen.getByRole('button', { name: 'Stop generating' }));

    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('stops on Escape and does not send on Enter while streaming', async () => {
    const { user, field, onStop, onSubmit } = setup({ streaming: true });

    await user.type(field, 'Next question{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(field).toHaveValue('Next question');

    await user.keyboard('{Escape}');
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('works as a controlled input', async () => {
    const onSubmit = vi.fn();
    function Controlled() {
      const [value, setValue] = useState('');
      return (
        <>
          <PromptInput label="Message" value={value} onValueChange={setValue} onSubmit={onSubmit} />
          <output>{value.length}</output>
        </>
      );
    }
    const user = userEvent.setup();
    render(<Controlled />);

    await user.type(screen.getByRole('textbox'), 'abc');
    expect(screen.getByRole('status')).toHaveTextContent('3');

    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('abc');
    expect(screen.getByRole('status')).toHaveTextContent('0');
  });

  it('describes the keyboard shortcuts and keeps custom descriptions', () => {
    render(
      <>
        <p id="limit">Up to 4,000 characters.</p>
        <PromptInput label="Message" onSubmit={() => {}} aria-describedby="limit" />
      </>,
    );
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription(
      'Up to 4,000 characters. Press Enter to send and Shift+Enter for a new line.',
    );
  });

  it('accepts translated labels', () => {
    setup({ labels: { send: 'Enviar mensagem' } });
    expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toBeInTheDocument();
  });

  it('respects a consumer keydown handler that prevents default', async () => {
    const onKeyDown = vi.fn((event: React.KeyboardEvent) => event.preventDefault());
    const { user, field, onSubmit } = setup({ onKeyDown, defaultValue: 'Hi' });

    await user.type(field, '{Enter}');

    expect(onKeyDown).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('has no axe violations in idle and streaming states', async () => {
    const { container, rerender } = setup();
    expect(await axeViolations(container)).toEqual([]);

    rerender(<PromptInput label="Message" onSubmit={() => {}} onStop={() => {}} streaming />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
