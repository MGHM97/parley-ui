import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../test/axe';
import { Message, MessageList, type MessageListProps } from './MessageList';

let resize: () => void = () => {};

class FakeResizeObserver {
  constructor(callback: () => void) {
    resize = callback;
  }
  observe() {}
  disconnect() {}
}

beforeEach(() => vi.stubGlobal('ResizeObserver', FakeResizeObserver));
afterEach(() => vi.unstubAllGlobals());

// jsdom has no layout, so give the log a scrollable size we control.
function fakeScroll(element: HTMLElement, { height = 1000, client = 300 } = {}) {
  let top = 0;
  let scrollHeight = height;
  Object.defineProperties(element, {
    clientHeight: { configurable: true, get: () => client },
    scrollHeight: { configurable: true, get: () => scrollHeight },
    scrollTop: {
      configurable: true,
      get: () => top,
      set: (value: number) => {
        top = Math.min(value, scrollHeight - client);
      },
    },
  });
  return {
    get top() {
      return top;
    },
    grow(by: number) {
      scrollHeight += by;
    },
    scrollTo(value: number) {
      element.scrollTop = value;
      fireEvent.scroll(element);
    },
  };
}

function Chat(props: Partial<MessageListProps>) {
  return (
    <MessageList label="Conversation" {...props}>
      <Message author="user">How do live regions work?</Message>
      <Message author="assistant">They announce changes to screen readers.</Message>
    </MessageList>
  );
}

describe('MessageList', () => {
  it('is a labelled log that does not announce by itself', () => {
    render(<Chat />);
    const log = screen.getByRole('log', { name: 'Conversation' });
    expect(log).toHaveAttribute('aria-live', 'off');
  });

  it('can opt into announcing new messages', () => {
    render(<Chat live="polite" />);
    expect(screen.getByRole('log')).toHaveAttribute('aria-live', 'polite');
  });

  it('is reachable by keyboard so it can be scrolled', async () => {
    const user = userEvent.setup();
    render(<Chat />);
    await user.tab();
    expect(screen.getByRole('log')).toHaveFocus();
  });

  it('names each message after its author', () => {
    render(<Chat />);
    const [question, answer] = screen.getAllByRole('article');
    expect(question).toHaveAccessibleName('You');
    expect(answer).toHaveAccessibleName('Assistant');
    expect(question).toHaveTextContent('YouHow do live regions work?');
  });

  it('accepts custom names and translated labels', () => {
    render(
      <MessageList label="Conversa" labels={{ authors: { user: 'Você' } }}>
        <Message author="user">Oi</Message>
        <Message author="assistant" name="Claude">
          Olá!
        </Message>
      </MessageList>,
    );
    const [question, answer] = screen.getAllByRole('article');
    expect(question).toHaveAccessibleName('Você');
    expect(answer).toHaveAccessibleName('Claude');
  });

  it('hides author names visually unless asked to show them', () => {
    const { rerender } = render(<Chat />);
    const author = () => screen.getAllByText('You')[0];
    expect(author()).toHaveStyle({ position: 'absolute' });

    rerender(<Chat showAuthors />);
    expect(author()).not.toHaveStyle({ position: 'absolute' });
  });

  it('starts at the latest message and follows new content', () => {
    const { rerender } = render(<Chat />);
    const log = screen.getByRole('log');
    const scroll = fakeScroll(log);

    rerender(<Chat />);
    expect(scroll.top).toBe(700);

    scroll.grow(200);
    act(() => resize());
    expect(scroll.top).toBe(900);
  });

  it('stops following when the user scrolls up, and offers a way back', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Chat />);
    const log = screen.getByRole('log');
    const scroll = fakeScroll(log);
    rerender(<Chat />);

    scroll.scrollTo(100);
    scroll.grow(200);
    act(() => resize());

    expect(scroll.top).toBe(100);
    const jump = screen.getByRole('button', { name: 'Jump to latest' });

    await user.click(jump);

    expect(scroll.top).toBe(900);
    expect(log).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Jump to latest' })).toBeNull();
  });

  it('keeps following when the user is near the bottom', () => {
    const { rerender } = render(<Chat />);
    const scroll = fakeScroll(screen.getByRole('log'));
    rerender(<Chat />);

    scroll.scrollTo(680);
    scroll.grow(100);
    act(() => resize());

    expect(scroll.top).toBe(800);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('works without ResizeObserver', () => {
    vi.unstubAllGlobals();
    vi.stubGlobal('ResizeObserver', undefined);
    expect(() => render(<Chat />)).not.toThrow();
  });

  it('has no axe violations', async () => {
    const { container, rerender } = render(<Chat />);
    const scroll = fakeScroll(screen.getByRole('log'));
    rerender(<Chat />);
    scroll.scrollTo(0);

    expect(screen.getByRole('button', { name: 'Jump to latest' })).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });
});
