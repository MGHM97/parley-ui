import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { StreamingText } from '../streaming-text/StreamingText';
import { PromptInput } from './PromptInput';

const meta = {
  title: 'Components/PromptInput',
  component: PromptInput,
  args: { label: 'Message', placeholder: 'Ask anything…', onSubmit: () => {} },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PromptInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const VisibleLabel: Story = {
  args: { showLabel: true, label: 'Ask the assistant' },
};

export const Streaming: Story = {
  args: { streaming: true, onStop: () => {} },
};

export const Translated: Story = {
  args: {
    label: 'Mensagem',
    placeholder: 'Pergunte qualquer coisa…',
    labels: {
      send: 'Enviar mensagem',
      stop: 'Parar geração',
      hint: 'Pressione Enter para enviar e Shift+Enter para nova linha.',
    },
  },
};

function Chat() {
  const [reply, setReply] = useState('');
  const [target, setTarget] = useState('');
  const streaming = reply.length < target.length;

  useEffect(() => {
    if (!streaming) return;
    const timer = setTimeout(() => setReply(target.slice(0, reply.length + 3)), 30);
    return () => clearTimeout(timer);
  }, [reply, target, streaming]);

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <StreamingText text={reply} streaming={streaming} style={{ minHeight: '4em' }} />
      <PromptInput
        label="Message"
        placeholder="Ask anything, then press Escape to stop…"
        streaming={streaming}
        onStop={() => setTarget(reply)}
        onSubmit={(message) => {
          setReply('');
          setTarget(
            `You asked: "${message}". This is a simulated answer that streams slowly enough for you to try the stop button or press Escape before it finishes.`,
          );
        }}
      />
    </div>
  );
}

export const WithStreamingText: Story = {
  name: 'Live demo: chat',
  render: () => <Chat />,
};
