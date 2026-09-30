import { describe, expect, it } from 'vitest';
import { mapFeaturesToIntake } from '../dream-script';
import type { AudioFeatures } from '../features';

const fixture: AudioFeatures = {
  version: 1,
  durationSeconds: 180,
  rmsEnergy: 0.72,
  tempoBpm: 118,
  spectralCentroidHz: 2400,
  spectralFlux: 0.64,
  sectionChangeDensity: 0.52,
};

describe('mapFeaturesToIntake', () => {
  it('creates a deterministic creative intake from explainable audio features', () => {
    const first = mapFeaturesToIntake(fixture);
    const second = mapFeaturesToIntake(fixture);

    expect(first).toEqual(second);
    expect(first.mapperVersion).toBe('1.0.0');
    expect(first.disclaimer).toContain('creative suggestion');
    expect(first.dreamSeeds).toHaveLength(3);
    expect(first.ideaPrompts).toHaveLength(3);
    expect(first.promptFragments).toHaveLength(3);
    expect(first.featureManifest).toEqual(fixture);
  });
});
