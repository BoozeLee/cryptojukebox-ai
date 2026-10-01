import { describe, expect, it, vi } from 'vitest';
import {
  AudioInputError,
  MAX_AUDIO_FILE_SIZE_BYTES,
  decodeAndExtractAudioFeatures,
  extractAudioFeatures,
  validateLocalAudioFile,
} from '../extract-features';

describe('validateLocalAudioFile', () => {
  it.each([
    ['track.wav', 'audio/wav'],
    ['track.WAV', 'audio/x-wav'],
    ['track.mp3', 'audio/mpeg'],
    ['track.ogg', 'audio/ogg'],
    ['track.m4a', 'audio/mp4'],
    ['track.webm', 'audio/webm'],
  ])('accepts the supported %s / %s pair within the fixed size limit', (name, type) => {
    expect(() => validateLocalAudioFile({ name, size: MAX_AUDIO_FILE_SIZE_BYTES, type })).not.toThrow();
  });

  it.each([
    [{ name: 'track.wav', size: 0, type: 'audio/wav' }, 'empty'],
    [{ name: 'track.wav', size: MAX_AUDIO_FILE_SIZE_BYTES + 1, type: 'audio/wav' }, '50 MiB'],
    [{ name: 'track.wav', size: 24, type: 'text/plain' }, 'supported audio'],
    [{ name: 'track.mp3', size: 24, type: 'audio/wav' }, 'supported audio'],
    [{ name: 'track', size: 24, type: 'audio/mpeg' }, 'supported audio'],
    [{ name: 'track.flac', size: 24, type: 'audio/flac' }, 'supported audio'],
  ])('rejects invalid audio file metadata', (file, message) => {
    expect(() => validateLocalAudioFile(file)).toThrow(AudioInputError);
    expect(() => validateLocalAudioFile(file)).toThrow(message);
  });
});

describe('extractAudioFeatures', () => {
  it('returns deterministic, zero-valued activity metrics for silent PCM', () => {
    const features = extractAudioFeatures(new Float32Array(100), 100);

    expect(features).toEqual({
      version: 1,
      durationSeconds: 1,
      rmsEnergy: 0,
      tempoBpm: 0,
      spectralCentroidHz: 0,
      spectralFlux: 0,
      sectionChangeDensity: 0,
    });
  });

  describe('decodeAndExtractAudioFeatures', () => {
    it('converts corrupt audio decoder failures into a safe input error', async () => {
      const file = {
        name: 'track.wav',
        size: 24,
        type: 'audio/wav',
        arrayBuffer: async () => new ArrayBuffer(24),
      };
      const decoder = {
        decodeAudioData: async () => {
          throw new Error('decoder implementation detail');
        },
      };

      await expect(decodeAndExtractAudioFeatures(file, decoder)).rejects.toThrow(
        'could not be decoded',
      );
    });

    it('refuses invalid metadata before reading or decoding the file', async () => {
      const arrayBuffer = vi.fn(async () => new ArrayBuffer(24));
      const decodeAudioData = vi.fn();

      await expect(
        decodeAndExtractAudioFeatures(
          {
            name: 'track.txt',
            size: 24,
            type: 'audio/mpeg',
            arrayBuffer,
          },
          { decodeAudioData },
        ),
      ).rejects.toThrow('supported audio');

      expect(arrayBuffer).not.toHaveBeenCalled();
      expect(decodeAudioData).not.toHaveBeenCalled();
    });
  });

  it('rejects invalid PCM metadata rather than producing a misleading artifact', () => {
    expect(() => extractAudioFeatures(new Float32Array(), 100)).toThrow(AudioInputError);
    expect(() => extractAudioFeatures(new Float32Array([0]), 0)).toThrow(AudioInputError);
  });
});
