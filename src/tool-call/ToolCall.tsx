import {
  type ComponentPropsWithoutRef,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { LiveRegion } from '../live-region/LiveRegion';
import { useAnnouncements } from '../live-region/useAnnouncements';

export type ToolCallStatus = 'pending' | 'running' | 'success' | 'error';

export interface ToolCallLabels {
  status: Record<ToolCallStatus, string>;
  input: string;
  output: string;
  error: string;
  /** What screen readers hear when the status changes. */
  announce: (title: string, status: string) => string;
  duration: (ms: number) => string;
}

const defaultLabels: ToolCallLabels = {
  status: { pending: 'Queued', running: 'Running', success: 'Done', error: 'Failed' },
  input: 'Input',
  output: 'Output',
  error: 'Error',
  announce: (title, status) => `${title}: ${status}`,
  duration: (ms) => (ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`),
};

export interface ToolCallProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  /** Tool identifier, e.g. `search_docs`. */
  name: string;
  /** Human-readable description, e.g. "Searching the docs". Falls back to `name`. */
  title?: string;
  status: ToolCallStatus;
  input?: unknown;
  output?: unknown;
  error?: ReactNode;
  durationMs?: number | undefined;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  labels?: Partial<Omit<ToolCallLabels, 'status'>> & { status?: Partial<ToolCallLabels['status']> };
  /** Custom renderer for input and output values. Defaults to formatted JSON. */
  renderValue?: (value: unknown, kind: 'input' | 'output') => ReactNode;
}

export function formatValue(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

function useStatusAnnouncement(status: ToolCallStatus, message: string) {
  const { announcements, announce } = useAnnouncements();
  // A call that mounts finished is chat history and stays quiet; one that
  // mounts queued or running is live activity and gets announced.
  const isSettled = status === 'success' || status === 'error';
  const previous = useRef<ToolCallStatus | null>(isSettled ? status : null);

  useEffect(() => {
    if (previous.current === status) return;
    previous.current = status;
    announce(message);
  }, [status, message, announce]);

  return announcements;
}

export function ToolCall({
  name,
  title = name,
  status,
  input,
  output,
  error,
  durationMs,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  labels: overrides,
  renderValue,
  ...rest
}: ToolCallProps) {
  const id = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;

  const labels: ToolCallLabels = {
    ...defaultLabels,
    ...overrides,
    status: { ...defaultLabels.status, ...overrides?.status },
  };
  const statusText = labels.status[status];
  const announcements = useStatusAnnouncement(status, labels.announce(title, statusText));

  const toggle = () => {
    if (controlledOpen === undefined) setUncontrolledOpen(!open);
    onOpenChange?.(!open);
  };

  const render = (value: unknown, kind: 'input' | 'output') =>
    renderValue ? renderValue(value, kind) : <pre>{formatValue(value)}</pre>;

  const panelId = `${id}-panel`;
  const duration = durationMs === undefined ? undefined : labels.duration(durationMs);
  // Adjacent spans would otherwise read as "Searching the docsRunning".
  const accessibleName = [title, statusText, duration].filter(Boolean).join(', ');

  return (
    <>
      <div data-parley-tool-call="" data-status={status} {...rest}>
        <button
          type="button"
          data-parley-tool-call-trigger=""
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={accessibleName}
          onClick={toggle}
        >
          <StatusIcon status={status} />
          <span data-parley-tool-call-title="">{title}</span>
          <span data-parley-tool-call-status="">{statusText}</span>
          {duration && <span data-parley-tool-call-duration="">{duration}</span>}
        </button>

        <div id={panelId} data-parley-tool-call-panel="" hidden={!open}>
          <p data-parley-tool-call-name="">
            <code>{name}</code>
          </p>
          <dl>
            {input !== undefined && (
              <div data-parley-tool-call-input="">
                <dt>{labels.input}</dt>
                <dd>{render(input, 'input')}</dd>
              </div>
            )}
            {output !== undefined && (
              <div data-parley-tool-call-output="">
                <dt>{labels.output}</dt>
                <dd>{render(output, 'output')}</dd>
              </div>
            )}
            {status === 'error' && error !== undefined && (
              <div data-parley-tool-call-error="">
                <dt>{labels.error}</dt>
                <dd>{error}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      <LiveRegion announcements={announcements} />
    </>
  );
}

function StatusIcon({ status }: { status: ToolCallStatus }) {
  const common = {
    'aria-hidden': true,
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'data-parley-tool-call-icon': '',
  } as const;

  switch (status) {
    case 'pending':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
        </svg>
      );
    case 'running':
      return (
        <svg {...common}>
          <path d="M21 12a9 9 0 1 1-9-9" />
        </svg>
      );
    case 'success':
      return (
        <svg {...common}>
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      );
    case 'error':
      return (
        <svg {...common}>
          <path d="M12 8v5M12 16.5v.5" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
