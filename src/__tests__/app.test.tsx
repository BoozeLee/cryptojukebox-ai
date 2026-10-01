import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

class TestAudioContext {
  readonly close = vi.fn(async () => {
    if (nextCloseError) {
      throw nextCloseError;
    }
  });
  readonly decodeAudioData = vi.fn(async () => ({
    numberOfChannels: 1,
    sampleRate: 100,
    getChannelData: () => new Float32Array(100),
  }));

  constructor() {
    audioContexts.push(this);
  }
}

const audioContexts: TestAudioContext[] = [];
const downloads: Array<{ filename: string; href: string }> = [];
let nextCloseError: Error | undefined;

beforeEach(() => {
  audioContexts.length = 0;
  downloads.length = 0;
  nextCloseError = undefined;

  vi.stubGlobal('AudioContext', TestAudioContext);
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:cryptojukebox'),
    revokeObjectURL: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    downloads.push({
      filename: this.download,
      href: this.href,
    });
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function selectFile(file: File): void {
  fireEvent.change(screen.getByLabelText('Select local audio'), {
    target: { files: [file] },
  });
}

describe('App', () => {
  it('renders the local-only audio boundary and disabled initial action', () => {
    render(<App />);

    expect(screen.getByText(/Processing stays in this browser\./)).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Create intake' }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('rejects unsupported input before creating an audio decoder', async () => {
    render(<App />);
    selectFile(new File(['audio'], 'track.txt', { type: 'audio/mpeg' }));

    fireEvent.click(screen.getByRole('button', { name: 'Create intake' }));

    expect(await screen.findByText('Choose a supported audio file type.')).toBeTruthy();
    expect(audioContexts).toHaveLength(0);
  });

  it('renders a creative intake and downloads both fixed-name artifacts', async () => {
    render(<App />);
    selectFile(new File(['audio'], 'track.mp3', { type: 'audio/mpeg' }));

    fireEvent.click(screen.getByRole('button', { name: 'Create intake' }));

    expect(
      await screen.findByText('This is a creative suggestion, not a factual inference about music or people.'),
    ).toBeTruthy();
    expect(screen.getByText('Symbolic motifs')).toBeTruthy();
    await waitFor(() => expect(audioContexts[0]?.close).toHaveBeenCalledOnce());

    fireEvent.click(screen.getByRole('button', { name: 'Download Markdown' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }));

    expect(downloads).toEqual([
      { filename: 'cryptojukebox-creative-intake.md', href: 'blob:cryptojukebox' },
      { filename: 'cryptojukebox-creative-intake.json', href: 'blob:cryptojukebox' },
    ]);
  });

  it('keeps the completed intake visible when AudioContext cleanup fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<App />);
    selectFile(new File(['audio'], 'track.mp3', { type: 'audio/mpeg' }));
    nextCloseError = new Error('close failure');

    fireEvent.click(screen.getByRole('button', { name: 'Create intake' }));

    expect(
      await screen.findByText('This is a creative suggestion, not a factual inference about music or people.'),
    ).toBeTruthy();
    await waitFor(() => expect(error).toHaveBeenCalledWith(
      'Unable to release audio processing resources.',
      expect.any(Error),
    ));
    expect(screen.getByText('Symbolic motifs')).toBeTruthy();
  });
});
