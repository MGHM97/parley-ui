import type { Preview } from '@storybook/react-vite';
import '../src/styles.css';
import './preview.css';

const preview: Preview = {
  parameters: {
    a11y: { test: 'error' },
    layout: 'padded',
  },
};

export default preview;
