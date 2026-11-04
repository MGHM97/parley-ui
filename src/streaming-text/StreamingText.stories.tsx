import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { StreamingText } from './StreamingText';
import type { AnnounceMode } from './useStreamAnnouncements';

const RESPONSE =
  'Sure. The build failed because the test runner could not find jsdom. ' +
  'Install it as a dev dependency and run the suite again. ' +
  'If it still fails, check that your Node version is 20 or newer, since version 3.2 of the runner dropped older releases.';

function useFakeStream(full: string, running: boolean, msPerToken = 45) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (!running) return;
    const tokens = full.match(/\S+\s*/g) ?? [];
    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setText(tokens.slice(0, index).join(''));
      if (index >= tokens.length) clearInterval(timer);
    }, msPerToken);
    return () => clearInterval(timer);
  }, [full, running, msPerToken]);

  return { text, streaming: running && text.length < full.length, reset: () => setText('') };
}

function Demo({ announce }: { announce: AnnounceMode }) {
  const [running, setRunning] = useState(false);
  const [heard, setHeard] = useState<string[]>([]);
  const { text, streaming, reset } = useFakeStream(RESPONSE, running);

  const start = () => {
    reset();
    setHeard([]);
    setRunning(false);
    queueMicrotask(() => setRunning(true));
  };

  return (
    <div style={{ display: 'grid', gap: '1.5rem', maxWidth: 720 }}>
      <button type="button" onClick={start} style={{ justifySelf: 'start' }}>
        {streaming ? 'Restart' : 'Stream a response'}
      </button>

      <section aria-labelledby="screen-title">
        <h2 id="screen-title" style={{ fontSize: 14 }}>
          On screen
        </h2>
        <StreamingText
          text={text}
          streaming={streaming}
          announce={announce}
          onAnnounce={(message) => setHeard((current) => [...current, message])}
          style={{ minHeight: '6em', padding: '1rem', border: '1px solid #ccc', borderRadius: 8 }}
        />
      </section>

      <section aria-labelledby="heard-title">
        <h2 id="heard-title" style={{ fontSize: 14 }}>
          Screen reader hears
        </h2>
        {heard.length === 0 ? (
          <p style={{ color: '#5c5b56' }}>Nothing yet.</p>
        ) : (
          <ol>
            {heard.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

const meta = {
  title: 'Components/StreamingText',
  component: StreamingText,
  args: { text: 'Hello! This is a streamed response.', streaming: false },
} satisfies Meta<typeof StreamingText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Streaming: Story = {
  args: { text: 'The model is still thinking about', streaming: true },
};

export const SentenceAnnouncements: Story = {
  name: 'Live demo: sentence announcements',
  render: () => <Demo announce="sentences" />,
};

export const FinalAnnouncement: Story = {
  name: 'Live demo: announce when done',
  render: () => <Demo announce="final" />,
};
