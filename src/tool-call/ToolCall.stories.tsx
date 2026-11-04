import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { StreamingText } from '../streaming-text/StreamingText';
import { ToolCall, type ToolCallStatus } from './ToolCall';

const meta = {
  title: 'Components/ToolCall',
  component: ToolCall,
  args: {
    name: 'search_docs',
    title: 'Searching the docs',
    status: 'success',
    input: { query: 'aria-live streaming', limit: 3 },
    output: [
      { title: 'ARIA live regions', url: 'https://developer.mozilla.org/' },
      { title: 'Using aria-busy', url: 'https://www.w3.org/WAI/ARIA/apg/' },
    ],
    durationMs: 840,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ToolCall>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {};

export const Running: Story = {
  args: { status: 'running', output: undefined, durationMs: undefined },
};

export const Pending: Story = {
  args: { status: 'pending', output: undefined, durationMs: undefined },
};

export const Failed: Story = {
  args: {
    status: 'error',
    output: undefined,
    error: 'The search service returned 429 Too Many Requests.',
    defaultOpen: true,
  },
};

export const Translated: Story = {
  args: {
    title: 'Buscando na documentação',
    status: 'running',
    output: undefined,
    durationMs: undefined,
    labels: {
      status: { pending: 'Na fila', running: 'Em execução', success: 'Concluído', error: 'Falhou' },
      input: 'Entrada',
      output: 'Saída',
      error: 'Erro',
    },
  },
};

interface Step {
  name: string;
  title: string;
  input: unknown;
  output: unknown;
}

const STEPS: Step[] = [
  {
    name: 'search_docs',
    title: 'Searching the docs',
    input: { query: 'screen reader streaming text' },
    output: ['ARIA live regions', 'aria-busy'],
  },
  {
    name: 'read_file',
    title: 'Reading StreamingText.tsx',
    input: { path: 'src/streaming-text/StreamingText.tsx' },
    output: '56 lines',
  },
];

const ANSWER =
  'Live regions re-read their whole content when it changes. StreamingText avoids that by announcing one complete sentence at a time. ';

function Agent() {
  const [tick, setTick] = useState(-1);
  const [answer, setAnswer] = useState('');
  const answering = tick >= STEPS.length * 2;
  const streaming = answering && answer.length < ANSWER.length;

  useEffect(() => {
    if (tick < 0 || answering) return;
    const timer = setTimeout(() => setTick((value) => value + 1), 1200);
    return () => clearTimeout(timer);
  }, [tick, answering]);

  useEffect(() => {
    if (!streaming) return;
    const timer = setTimeout(() => setAnswer(ANSWER.slice(0, answer.length + 4)), 35);
    return () => clearTimeout(timer);
  }, [streaming, answer]);

  const statusOf = (index: number): ToolCallStatus => {
    if (tick < index * 2) return 'pending';
    if (tick === index * 2) return 'running';
    return 'success';
  };

  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <button
        type="button"
        style={{ justifySelf: 'start' }}
        onClick={() => {
          setAnswer('');
          setTick(0);
        }}
      >
        Run the agent
      </button>
      {tick >= 0 &&
        STEPS.map((step, index) => {
          const status = statusOf(index);
          return (
            <ToolCall
              key={step.name}
              name={step.name}
              title={step.title}
              status={status}
              input={step.input}
              {...(status === 'success' ? { output: step.output } : {})}
            />
          );
        })}
      {answering && <StreamingText text={answer} streaming={streaming} />}
    </div>
  );
}

export const AgentRun: Story = {
  name: 'Live demo: agent run',
  render: () => <Agent />,
};
