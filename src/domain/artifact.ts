import type { AudioFeatures } from './features';

export interface CreativeIntake {
  mapperVersion: '1.0.0';
  disclaimer: string;
  atmosphere: string;
  symbolicMotifs: string[];
  dreamSeeds: string[];
  ideaPrompts: string[];
  promptFragments: string[];
  featureManifest: AudioFeatures;
}
