import { describe, expect, it } from 'vitest';
import {
  AudioInputError,
  MAX_AUDIO_FILE_SIZE_BYTES,
  decodeAndExtractAudioFeatures,
  extractAudioFeatures,
  validateLocalAudioFile,
} from '../extract-features';

describe('validateLocalAudioFile', () => {
  it('accepts an authorized local audio file within the fixed size limit', () => {
    expect(() => validateLocalAudioFile({ size: 24, type: 'audio/wav' })).not.toThrow();
  });

  it.each([
    [{ size: 0, type: 'audio/wav' }, 'empty'],
    [{ size: MAX_AUDIO_FILE_SIZE_BYTES + 1, type: 'audio/wav' }, '50 MiB'],
    [{ size: 24, type: 'text/plain' }, 'supported audio'],
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
  });

  it('rejects invalid PCM metadata rather than producing a misleading artifact', () => {
    expect(() => extractAudioFeatures(new Float32Array(), 100)).toThrow(AudioInputError);
    expect(() => extractAudioFeatures(new Float32Array([0]), 0)).toThrow(AudioInputError);
  });
});
