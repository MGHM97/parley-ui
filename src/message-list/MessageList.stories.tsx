import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { PromptInput } from '../prompt-input/PromptInput';
import { StreamingText } from '../streaming-text/StreamingText';
import { ToolCall, type ToolCallStatus } from '../tool-call/ToolCall';
import { Message, MessageList } from './MessageList';

const meta = {
  title: 'Components/MessageList',
  component: MessageList,
  args: { label: 'Conversation' },
} satisfies Meta<typeof MessageList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Static: Story = {
  render: (args) => (
    <MessageList
      {...args}
      showAuthors
      style={{ height: 320, maxWidth: 560, border: '1px solid #ccc' }}
    >
      <Message author="user">What does role="log" do?</Message>
      <Message author="assistant">
        It marks a region where new information is added in order, like a chat. By default it is
        also a polite live region.
      </Message>
      <Message author="user">Then why does parley-ui turn that off?</Message>
      <Message author="assistant">
        Because StreamingText already announces replies sentence by sentence. Leaving both on would
        read every answer twice.
      </Message>
    </MessageList>
  ),
};

interface Turn {
  id: number;
  question: string;
  answer: string;
}

const reply = (question: string) =>
  `You asked "${question}". I looked it up first, then wrote this answer. Scroll up while it streams: the list stops following you and offers a way back. `;

function Chat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [tool, setTool] = useState<ToolCallStatus>('success');
  const [text, setText] = useState('');
  const current = turns.at(-1);
  const streaming = !!current && tool === 'success' && text.length < current.answer.length;

  useEffect(() => {
    if (tool !== 'running') return;
    const timer = setTimeout(() => setTool('success'), 900);
    return () => clearTimeout(timer);
  }, [tool]);

  useEffect(() => {
    if (!streaming || !current) return;
    const timer = setTimeout(() => setText(current.answer.slice(0, text.length + 3)), 40);
    return () => clearTimeout(timer);
  }, [streaming, current, text]);

  return (
    <div style={{ display: 'grid', gap: '0.75rem', maxWidth: 560 }}>
      <MessageList label="Conversation" style={{ height: 360, border: '1px solid #ccc' }}>
        {turns.map((turn) => {
          const isCurrent = turn === current;
          return [
            <Message key={`${turn.id}-q`} author="user">
              {turn.question}
            </Message>,
            <Message key={`${turn.id}-a`} author="assistant">
              <ToolCall
                name="search_docs"
                title="Searching the docs"
                status={isCurrent ? tool : 'success'}
                input={{ query: turn.question }}
              />
              {(!isCurrent || tool === 'success') && (
                <StreamingText
                  text={isCurrent ? text : turn.answer}
                  streaming={isCurrent && streaming}
                />
              )}
            </Message>,
          ];
        })}
      </MessageList>
      <PromptInput
        label="Message"
        placeholder="Ask something…"
        streaming={tool === 'running' || streaming}
        onStop={() => {
          setTool('success');
          if (current)
            setTurns((all) => all.map((t) => (t === current ? { ...t, answer: text } : t)));
        }}
        onSubmit={(question) => {
          setText('');
          setTool('running');
          setTurns((all) => [...all, { id: all.length, question, answer: reply(question) }]);
        }}
      />
    </div>
  );
}

export const FullChat: Story = {
  name: 'Live demo: full chat',
  render: () => <Chat />,
};
