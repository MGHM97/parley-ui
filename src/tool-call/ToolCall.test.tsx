import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../test/axe';
import { formatValue, ToolCall, type ToolCallProps, type ToolCallStatus } from './ToolCall';

const base: ToolCallProps = {
  name: 'search_docs',
  title: 'Searching the docs',
  status: 'running',
  input: { query: 'aria-live' },
};

function setup(props: Partial<ToolCallProps> = {}) {
  const user = userEvent.setup();
  const view = render(<ToolCall {...base} {...props} />);
  const update = (next: Partial<ToolCallProps>) =>
    view.rerender(<ToolCall {...base} {...props} {...next} />);
  const trigger = () => screen.getByRole('button');
  const region = () => view.container.querySelector('[aria-live]');
  return { ...view, user, update, trigger, region };
}

describe('ToolCall', () => {
  it('names the trigger with the title and the current status', () => {
    const { trigger } = setup();
    expect(trigger()).toHaveAccessibleName('Searching the docs, Running');
  });

  it('falls back to the tool name when no title is given', () => {
    render(<ToolCall name="search_docs" status="running" />);
    expect(screen.getByRole('button')).toHaveAccessibleName('search_docs, Running');
  });

  it('starts collapsed and toggles its panel', async () => {
    const { user, trigger } = setup();
    const panel = document.getElementById(trigger().getAttribute('aria-controls') ?? '');

    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(panel).not.toBeVisible();

    await user.click(trigger());
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(panel).toBeVisible();

    await user.keyboard('{Enter}');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows input and output as readable values', () => {
    setup({ status: 'success', output: 'Found 3 results', defaultOpen: true });

    expect(screen.getByText('Input')).toBeInTheDocument();
    expect(screen.getByText(/"query": "aria-live"/)).toBeInTheDocument();
    expect(screen.getByText('Found 3 results')).toBeInTheDocument();
  });

  it('shows the error only when the call failed', () => {
    const { update } = setup({ error: 'Rate limited', defaultOpen: true });
    expect(screen.queryByText('Rate limited')).toBeNull();

    update({ status: 'error' });
    expect(screen.getByText('Rate limited')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAccessibleName(/Failed/);
  });

  it('stays quiet when it mounts already finished', () => {
    const { region } = setup({ status: 'success' });
    expect(region()).toBeEmptyDOMElement();
  });

  it('announces a call that mounts while running', () => {
    const { region } = setup({ status: 'running' });
    expect(region()).toHaveTextContent('Searching the docs: Running');
  });

  it('announces each status change once', () => {
    const { update, region } = setup({ status: 'pending' });

    update({ status: 'running' });
    update({ status: 'running', input: { query: 'changed' } });
    update({ status: 'success' });

    const messages = [...(region()?.children ?? [])].map((node) => node.textContent);
    expect(messages).toEqual([
      'Searching the docs: Queued',
      'Searching the docs: Running',
      'Searching the docs: Done',
    ]);
  });

  it('does not double-announce under StrictMode', () => {
    const view = render(
      <StrictMode>
        <ToolCall {...base} status="running" />
      </StrictMode>,
    );
    const region = () => view.container.querySelector('[aria-live]');
    expect(region()?.children).toHaveLength(1);

    view.rerender(
      <StrictMode>
        <ToolCall {...base} status="success" />
      </StrictMode>,
    );
    expect(region()?.children).toHaveLength(2);
  });

  it('can be controlled', async () => {
    const onOpenChange = vi.fn();
    const { user, trigger } = setup({ open: false, onOpenChange });

    await user.click(trigger());

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('accepts translated labels', () => {
    const { update, region } = setup({
      status: 'pending',
      labels: {
        status: { running: 'Em execução', success: 'Concluído' },
        announce: (title, status) => `${title} — ${status}`,
      },
      title: 'Buscando na documentação',
    });

    update({ status: 'running' });

    expect(screen.getByRole('button')).toHaveAccessibleName(
      'Buscando na documentação, Em execução',
    );
    expect(region()).toHaveTextContent('Buscando na documentação — Em execução');
  });

  it('formats durations', () => {
    setup({ status: 'success', durationMs: 1830 });
    expect(screen.getByRole('button')).toHaveAccessibleName('Searching the docs, Done, 1.8 s');
  });

  it('supports a custom value renderer', () => {
    setup({
      defaultOpen: true,
      renderValue: (value, kind) => <output>{`${kind}:${formatValue(value).length}`}</output>,
    });
    expect(screen.getByRole('status')).toHaveTextContent(/^input:\d+$/);
  });

  it.each<ToolCallStatus>(['pending', 'running', 'success', 'error'])(
    'has no axe violations when %s, open or closed',
    async (status) => {
      const { container, user, trigger } = setup({ status, output: { ok: true }, error: 'Oops' });
      expect(await axeViolations(container)).toEqual([]);
      await user.click(trigger());
      expect(await axeViolations(container)).toEqual([]);
    },
  );
});

describe('formatValue', () => {
  it('keeps strings, pretty-prints objects and survives circular data', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(formatValue('plain')).toBe('plain');
    expect(formatValue({ a: 1 })).toBe('{\n  "a": 1\n}');
    expect(formatValue(circular)).toBe('[object Object]');
    expect(formatValue(undefined)).toBe('undefined');
  });
});
