import { useState } from 'react';
import {
  AudioInputError,
  decodeAndExtractAudioFeatures,
  validateLocalAudioFile,
} from './audio/extract-features';
import type { CreativeIntake } from './domain/artifact';
import { mapFeaturesToIntake } from './domain/dream-script';
import { serializeIntakeAsJson, serializeIntakeAsMarkdown } from './domain/export';
import './App.css';

type AnalysisState = 'idle' | 'processing' | 'ready' | 'error';

function downloadArtifact(contents: string, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function closeAudioContext(audioContext: AudioContext): Promise<void> {
  try {
    await audioContext.close();
  } catch (error) {
    console.error('Unable to release audio processing resources.', error);
  }
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [intake, setIntake] = useState<CreativeIntake | null>(null);

  async function analyzeAudio(): Promise<void> {
    if (!file) {
      setAnalysisState('error');
      setErrorMessage('Choose a local audio file before creating an intake.');
      return;
    }

    try {
      validateLocalAudioFile(file);
    } catch (error) {
      setAnalysisState('error');
      setErrorMessage(error instanceof AudioInputError ? error.message : 'Choose a valid audio file.');
      return;
    }

    setAnalysisState('processing');
    setErrorMessage('');
    setIntake(null);

    let audioContext: AudioContext | undefined;

    try {
      audioContext = new AudioContext();
      const features = await decodeAndExtractAudioFeatures(file, audioContext);
      setIntake(mapFeaturesToIntake(features));
      setAnalysisState('ready');
    } catch (error) {
      setAnalysisState('error');
      setErrorMessage(
        error instanceof AudioInputError
          ? error.message
          : 'The selected file could not be analyzed in this browser.',
      );
    } finally {
      if (audioContext) {
        await closeAudioContext(audioContext);
      }
    }
  }

  return (
    <main className="app-shell">
      <header className="masthead">
        <a className="wordmark" href="#start">
          CryptoJukebox
        </a>
        <p>Local sound → creative intake</p>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">Dream Script / 01</p>
        <h1 id="page-title">Shape a new creative thread from a song.</h1>
        <p className="lede">
          Select music you own or are authorized to process. Your browser derives a small
          creative intake without uploading or storing the audio.
        </p>
      </section>

      <section className="workspace" id="start" aria-labelledby="workspace-title">
        <div className="workspace-heading">
          <p className="eyebrow">Local studio</p>
          <h2 id="workspace-title">Choose an audio file</h2>
          <p>WAV, MP3, OGG, M4A, or WebM · 50 MiB maximum</p>
        </div>

        <div className="file-controls">
          <label className="file-picker" htmlFor="audio-file">
            <span>Select local audio</span>
            <input
              id="audio-file"
              type="file"
              accept="audio/wav,audio/x-wav,audio/mpeg,audio/ogg,audio/mp4,audio/webm"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setAnalysisState('idle');
                setErrorMessage('');
                setIntake(null);
              }}
            />
          </label>
          <p className="selected-file" aria-live="polite">
            {file ? `${file.name} selected` : 'No file selected'}
          </p>
          <button
            className="primary-button"
            type="button"
            onClick={() => void analyzeAudio()}
            disabled={!file || analysisState === 'processing'}
          >
            {analysisState === 'processing' ? 'Creating intake…' : 'Create intake'}
          </button>
        </div>

        <p className="privacy-note">
          Processing stays in this browser. CryptoJukebox does not upload, retain, or identify
          your audio.
        </p>
      </section>

      <section className="status-region" aria-live="polite" aria-atomic="true">
        {analysisState === 'processing' && <p>Analyzing your local audio…</p>}
        {analysisState === 'error' && <p className="status-error">{errorMessage}</p>}
      </section>

      {intake && (
        <section className="intake" aria-labelledby="intake-title">
          <div className="intake-heading">
            <div>
              <p className="eyebrow">Creative intake</p>
              <h2 id="intake-title">{intake.atmosphere}</h2>
            </div>
            <div className="downloads" aria-label="Download creative intake">
              <button
                type="button"
                onClick={() =>
                  downloadArtifact(
                    serializeIntakeAsMarkdown(intake),
                    'cryptojukebox-creative-intake.md',
                    'text/markdown;charset=utf-8',
                  )
                }
              >
                Download Markdown
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadArtifact(
                    serializeIntakeAsJson(intake),
                    'cryptojukebox-creative-intake.json',
                    'application/json;charset=utf-8',
                  )
                }
              >
                Download JSON
              </button>
            </div>
          </div>

          <p className="disclaimer">{intake.disclaimer}</p>

          <div className="intake-grid">
            <IntakeList title="Symbolic motifs" items={intake.symbolicMotifs} />
            <IntakeList title="Dream seeds" items={intake.dreamSeeds} />
            <IntakeList title="Idea prompts" items={intake.ideaPrompts} />
            <IntakeList title="Prompt fragments" items={intake.promptFragments} />
          </div>
        </section>
      )}

      <footer>
        Creative suggestions only. Not analysis of an artist, listener, health, mental state, or
        consciousness.
      </footer>
    </main>
  );
}

function IntakeList({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default App;
