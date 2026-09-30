import { describe, expect, it } from 'vitest';
import { serializeIntakeAsJson, serializeIntakeAsMarkdown } from '../export';
import type { CreativeIntake } from '../artifact';

const intake: CreativeIntake = {
  mapperVersion: '1.0.0',
  disclaimer: 'This is a creative suggestion, not a factual inference.',
  atmosphere: 'luminous and kinetic',
  symbolicMotifs: ['prism', 'threshold', 'pulse'],
  dreamSeeds: ['A prism hums above a moving city.'],
  ideaPrompts: ['Turn a pulse into a visual score.'],
  promptFragments: ['luminous kinetic prism'],
  featureManifest: {
    version: 1,
    durationSeconds: 120,
    rmsEnergy: 0.5,
    tempoBpm: 100,
    spectralCentroidHz: 2000,
    spectralFlux: 0.4,
    sectionChangeDensity: 0.3,
  },
};

describe('creative-intake exports', () => {
  it('serializes stable Markdown and JSON without executable markup', () => {
    const markdown = serializeIntakeAsMarkdown(intake);
    const json = serializeIntakeAsJson(intake);

    expect(markdown).toContain('# CryptoJukebox creative intake');
    expect(markdown).not.toContain('<script');
    expect(JSON.parse(json)).toEqual(intake);
    expect(json).not.toContain('audioBytes');
    expect(json).not.toContain('fileName');
  });
});
