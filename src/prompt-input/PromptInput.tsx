import {
  type ComponentPropsWithoutRef,
  type FormEvent,
  type KeyboardEvent,
  useId,
  useRef,
  useState,
} from 'react';
import { visuallyHidden } from '../utils/visuallyHidden';

export interface PromptInputLabels {
  send: string;
  stop: string;
  hint: string;
}

const defaultLabels: PromptInputLabels = {
  send: 'Send message',
  stop: 'Stop generating',
  hint: 'Press Enter to send and Shift+Enter for a new line.',
};

type TextareaProps = Omit<
  ComponentPropsWithoutRef<'textarea'>,
  'value' | 'defaultValue' | 'onSubmit' | 'children'
>;

export interface PromptInputProps extends TextareaProps {
  /** Accessible name of the text field. Visually hidden unless `showLabel` is set. */
  label: string;
  showLabel?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSubmit: (value: string) => void;
  /** While true, the send button becomes a stop button and Escape stops generation. */
  streaming?: boolean;
  onStop?: () => void;
  labels?: Partial<PromptInputLabels>;
  formProps?: Omit<ComponentPropsWithoutRef<'form'>, 'onSubmit'>;
}

function isComposing(event: KeyboardEvent<HTMLTextAreaElement>) {
  // Safari fires the confirming Enter after compositionend, with isComposing
  // already false. keyCode 229 is the only signal left in that case.
  return event.nativeEvent.isComposing || event.keyCode === 229;
}

export function PromptInput({
  label,
  showLabel = false,
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  onSubmit,
  streaming = false,
  onStop,
  labels: labelOverrides,
  formProps,
  disabled = false,
  onKeyDown,
  onChange,
  rows = 1,
  'aria-describedby': describedBy,
  ...textareaProps
}: PromptInputProps) {
  const id = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;
  const labels = { ...defaultLabels, ...labelOverrides };
  const canSend = !disabled && !streaming && value.trim().length > 0;

  const setValue = (next: string) => {
    if (!isControlled) setUncontrolledValue(next);
    onValueChange?.(next);
  };

  const submit = () => {
    if (!canSend) return;
    onSubmit(value);
    setValue('');
    textareaRef.current?.focus();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (streaming) onStop?.();
    else submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    if (event.key === 'Escape' && streaming) {
      event.preventDefault();
      onStop?.();
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey && !isComposing(event)) {
      event.preventDefault();
      submit();
    }
  };

  const buttonLabel = streaming ? labels.stop : labels.send;
  const buttonUnavailable = streaming ? !onStop : !canSend;

  return (
    <form data-parley-prompt-input="" {...formProps} onSubmit={handleSubmit}>
      <label htmlFor={`${id}-field`} style={showLabel ? undefined : visuallyHidden}>
        {label}
      </label>
      <textarea
        {...textareaProps}
        ref={textareaRef}
        id={`${id}-field`}
        rows={rows}
        value={value}
        disabled={disabled}
        aria-describedby={describedBy ? `${describedBy} ${id}-hint` : `${id}-hint`}
        onChange={(event) => {
          onChange?.(event);
          setValue(event.target.value);
        }}
        onKeyDown={handleKeyDown}
      />
      <span id={`${id}-hint`} style={visuallyHidden}>
        {labels.hint}
      </span>
      <button
        type="submit"
        data-parley-action={streaming ? 'stop' : 'send'}
        aria-label={buttonLabel}
        aria-disabled={buttonUnavailable || undefined}
        disabled={disabled}
      >
        {streaming ? <StopIcon /> : <SendIcon />}
      </button>
    </form>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 19V5M5 12l7-7 7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
    </svg>
  );
}
