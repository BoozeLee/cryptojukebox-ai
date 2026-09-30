import type { AudioFeatures } from '../domain/features';

export const MAX_AUDIO_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const supportedAudioTypes = new Set([
  'audio/wav',
  'audio/x-wav',
  'audio/mpeg',
  'audio/ogg',
  'audio/mp4',
  'audio/webm',
]);

export interface LocalAudioFile {
  size: number;
  type: string;
}

export interface ReadableLocalAudioFile extends LocalAudioFile {
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface DecodedAudioBuffer {
  numberOfChannels: number;
  sampleRate: number;
  getChannelData(channel: number): Float32Array;
}

export interface AudioDecoder {
  decodeAudioData(audioData: ArrayBuffer): Promise<DecodedAudioBuffer>;
}

export class AudioInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AudioInputError';
  }
}

export function validateLocalAudioFile(file: LocalAudioFile): void {
  if (!Number.isFinite(file.size) || file.size <= 0) {
    throw new AudioInputError('Choose a non-empty local audio file.');
  }

  if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
    throw new AudioInputError('Choose an audio file smaller than 50 MiB.');
  }

  if (!supportedAudioTypes.has(file.type.toLowerCase())) {
    throw new AudioInputError('Choose a supported audio file type.');
  }
}

export function extractAudioFeatures(samples: Float32Array, sampleRate: number): AudioFeatures {
  if (samples.length === 0) {
    throw new AudioInputError('Decoded audio contains no samples.');
  }

  if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
    throw new AudioInputError('Decoded audio has an invalid sample rate.');
  }

  const durationSeconds = samples.length / sampleRate;
  const frameEnergies = collectFrameEnergies(samples, 64);
  const spectra = collectSpectra(samples);

  return {
    version: 1,
    durationSeconds: roundMetric(durationSeconds),
    rmsEnergy: roundMetric(rootMeanSquare(samples)),
    tempoBpm: estimateTempoBpm(frameEnergies, durationSeconds),
    spectralCentroidHz: estimateSpectralCentroidHz(spectra[0] ?? [], sampleRate),
    spectralFlux: estimateSpectralFlux(spectra),
    sectionChangeDensity: estimateSectionChangeDensity(frameEnergies),
  };
}

export async function decodeAndExtractAudioFeatures(
  file: ReadableLocalAudioFile,
  decoder: AudioDecoder,
): Promise<AudioFeatures> {
  validateLocalAudioFile(file);

  let encodedAudio: ArrayBuffer;
  try {
    encodedAudio = await file.arrayBuffer();
  } catch {
    throw new AudioInputError('The selected audio file could not be read.');
  }

  let decodedAudio: DecodedAudioBuffer;
  try {
    decodedAudio = await decoder.decodeAudioData(encodedAudio);
  } catch {
    throw new AudioInputError('The selected audio file could not be decoded.');
  }

  if (decodedAudio.numberOfChannels < 1) {
    throw new AudioInputError('Decoded audio contains no channels.');
  }

  return extractAudioFeatures(decodedAudio.getChannelData(0), decodedAudio.sampleRate);
}

function rootMeanSquare(samples: Float32Array): number {
  let sumSquares = 0;

  for (const sample of samples) {
    sumSquares += sample * sample;
  }

  return Math.sqrt(sumSquares / samples.length);
}

function collectFrameEnergies(samples: Float32Array, targetFrameCount: number): number[] {
  const frameCount = Math.min(targetFrameCount, samples.length);
  const frameLength = Math.max(1, Math.floor(samples.length / frameCount));
  const energies: number[] = [];

  for (let frame = 0; frame < frameCount; frame += 1) {
    const start = frame * frameLength;
    const end = frame === frameCount - 1 ? samples.length : start + frameLength;
    energies.push(rootMeanSquare(samples.subarray(start, end)));
  }

  return energies;
}

function collectSpectra(samples: Float32Array): number[][] {
  const frameLength = Math.min(256, samples.length);
  if (frameLength < 2) {
    return [[]];
  }

  const frameCount = Math.min(24, Math.floor(samples.length / frameLength));
  const maximumStart = samples.length - frameLength;
  const spectra: number[][] = [];

  for (let frame = 0; frame < frameCount; frame += 1) {
    const start = frameCount === 1 ? 0 : Math.floor((maximumStart * frame) / (frameCount - 1));
    spectra.push(computeMagnitudes(samples.subarray(start, start + frameLength)));
  }

  return spectra;
}

function computeMagnitudes(samples: Float32Array): number[] {
  const binCount = Math.min(64, Math.floor(samples.length / 2));
  const magnitudes: number[] = [];

  for (let bin = 1; bin <= binCount; bin += 1) {
    let real = 0;
    let imaginary = 0;

    for (let index = 0; index < samples.length; index += 1) {
      const phase = (2 * Math.PI * bin * index) / samples.length;
      real += samples[index] * Math.cos(phase);
      imaginary -= samples[index] * Math.sin(phase);
    }

    magnitudes.push(Math.hypot(real, imaginary) / samples.length);
  }

  return magnitudes;
}

function estimateTempoBpm(frameEnergies: number[], durationSeconds: number): number {
  if (frameEnergies.length < 3 || durationSeconds <= 0) {
    return 0;
  }

  const meanEnergy = frameEnergies.reduce((sum, value) => sum + value, 0) / frameEnergies.length;
  const peaks = frameEnergies.flatMap((energy, index) => {
    const previous = frameEnergies[index - 1] ?? energy;
    const next = frameEnergies[index + 1] ?? energy;
    return energy > meanEnergy * 1.2 && energy > previous && energy >= next ? [index] : [];
  });

  if (peaks.length < 2) {
    return 0;
  }

  const intervals = peaks.slice(1).map((peak, index) => peak - peaks[index]);
  const averageInterval = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
  const bpm = (60 * frameEnergies.length) / (averageInterval * durationSeconds);

  return bpm >= 40 && bpm <= 240 ? Math.round(bpm) : 0;
}

function estimateSpectralCentroidHz(magnitudes: number[], sampleRate: number): number {
  const totalMagnitude = magnitudes.reduce((sum, value) => sum + value, 0);
  if (totalMagnitude === 0) {
    return 0;
  }

  const weightedFrequencies = magnitudes.reduce(
    (sum, magnitude, index) => sum + magnitude * (((index + 1) * sampleRate) / 512),
    0,
  );

  return roundMetric(weightedFrequencies / totalMagnitude);
}

function estimateSpectralFlux(spectra: number[][]): number {
  if (spectra.length < 2 || spectra[0]?.length === 0) {
    return 0;
  }

  let flux = 0;
  let comparisons = 0;

  for (let index = 1; index < spectra.length; index += 1) {
    const previous = spectra[index - 1];
    const current = spectra[index];

    for (let bin = 0; bin < current.length; bin += 1) {
      flux += Math.abs(current[bin] - previous[bin]);
      comparisons += 1;
    }
  }

  return roundMetric(flux / comparisons);
}

function estimateSectionChangeDensity(frameEnergies: number[]): number {
  if (frameEnergies.length < 2) {
    return 0;
  }

  const meanEnergy = frameEnergies.reduce((sum, value) => sum + value, 0) / frameEnergies.length;
  const threshold = Math.max(0.02, meanEnergy * 0.5);
  let changes = 0;

  for (let index = 1; index < frameEnergies.length; index += 1) {
    if (Math.abs(frameEnergies[index] - frameEnergies[index - 1]) > threshold) {
      changes += 1;
    }
  }

  return roundMetric(changes / (frameEnergies.length - 1));
}

function roundMetric(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
