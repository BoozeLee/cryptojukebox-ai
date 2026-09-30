import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders the local-only audio boundary and disabled initial action', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Select local audio');
    expect(markup).toContain('Processing stays in this browser');
    expect(markup).toContain('disabled=""');
    expect(markup).not.toContain('http://');
    expect(markup).not.toContain('https://');
  });
});
