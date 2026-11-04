import { render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../test/axe';
import { StreamingText, type StreamingTextProps } from './StreamingText';

function setup(initial: StreamingTextProps) {
  const onAnnounce = vi.fn();
  const view = render(<StreamingText {...initial} onAnnounce={onAnnounce} />);
  const update = (next: Partial<StreamingTextProps>) =>
    view.rerender(<StreamingText {...initial} {...next} onAnnounce={onAnnounce} />);
  const region = () => view.container.querySelector('[aria-live]');
  return { ...view, update, onAnnounce, region };
}

describe('StreamingText', () => {
  it('renders the text received so far', () => {
    render(<StreamingText text="Hello there" streaming />);
    expect(screen.getByText('Hello there')).toBeInTheDocument();
  });

  it('announces sentences only once they are complete', () => {
    const { update, onAnnounce, region } = setup({ text: '', streaming: true });

    update({ text: 'The build' });
    update({ text: 'The build passed. Deploying' });
    update({ text: 'The build passed. Deploying now. ' });

    expect(onAnnounce.mock.calls).toEqual([['The build passed.'], ['Deploying now.']]);
    expect(region()).toHaveTextContent('The build passed.Deploying now.');
  });

  it('announces the unfinished tail when streaming ends', () => {
    const { update, onAnnounce } = setup({ text: '', streaming: true });

    update({ text: 'All set. Anything else' });
    update({ text: 'All set. Anything else', streaming: false });

    expect(onAnnounce.mock.calls).toEqual([['All set.'], ['Anything else']]);
  });

  it('does not announce text that was already there on mount', () => {
    const { update, onAnnounce } = setup({ text: 'Earlier message. ', streaming: false });
    update({ text: 'Earlier message. ' });
    expect(onAnnounce).not.toHaveBeenCalled();
  });

  it('starts over when a new response replaces the text', () => {
    const { update, onAnnounce } = setup({ text: '', streaming: true });

    update({ text: 'A long first answer. ' });
    update({ text: '' });
    update({ text: 'Short. ' });

    expect(onAnnounce.mock.calls).toEqual([['A long first answer.'], ['Short.']]);
  });

  it('announces the whole response at the end in final mode', () => {
    const { update, onAnnounce } = setup({ text: '', streaming: true, announce: 'final' });

    update({ text: 'One. Two. ' });
    expect(onAnnounce).not.toHaveBeenCalled();

    update({ text: 'One. Two. Three', streaming: false });
    expect(onAnnounce.mock.calls).toEqual([['One. Two. Three']]);
  });

  it('stays silent in off mode', () => {
    const { update, onAnnounce, region } = setup({ text: '', streaming: true, announce: 'off' });

    update({ text: 'Hidden. ' });
    update({ text: 'Hidden. ', streaming: false });

    expect(onAnnounce).not.toHaveBeenCalled();
    expect(region()).toBeEmptyDOMElement();
  });

  it('marks itself busy and shows a decorative cursor while streaming', () => {
    const { container, update } = setup({ text: 'Hi', streaming: true });
    const root = container.querySelector('[data-parley-streaming-text]');

    expect(root).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('[data-parley-cursor]')).toHaveAttribute('aria-hidden', 'true');

    update({ streaming: false });
    expect(root).not.toHaveAttribute('aria-busy');
    expect(container.querySelector('[data-parley-cursor]')).toBeNull();
  });

  it('keeps the live region outside the busy subtree', () => {
    const { container } = setup({ text: 'Hi', streaming: true });
    const busy = container.querySelector('[aria-busy="true"]');
    expect(busy?.querySelector('[aria-live]')).toBeNull();
  });

  it('announces once under StrictMode double effects', () => {
    const onAnnounce = vi.fn();
    render(
      <StrictMode>
        <StreamingText text="Only once. " streaming onAnnounce={onAnnounce} />
      </StrictMode>,
    );
    expect(onAnnounce).toHaveBeenCalledTimes(1);
  });

  it('supports a custom renderer', () => {
    render(<StreamingText text="bold">{(text) => <strong>{text}</strong>}</StreamingText>);
    expect(screen.getByText('bold').tagName).toBe('STRONG');
  });

  it('has no axe violations', async () => {
    const { container, update } = setup({ text: '', streaming: true });
    update({ text: 'Accessible by default. Mostly' });
    expect(await axeViolations(container)).toEqual([]);
  });
});
