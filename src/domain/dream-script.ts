import type { CreativeIntake } from './artifact';
import type { AudioFeatures } from './features';

const disclaimer = 'This is a creative suggestion, not a factual inference about music or people.';

function energyWord(rmsEnergy: number): string {
  return rmsEnergy >= 0.66 ? 'kinetic' : rmsEnergy >= 0.33 ? 'steady' : 'weightless';
}

function brightnessWord(spectralCentroidHz: number): string {
  return spectralCentroidHz >= 3000 ? 'luminous' : spectralCentroidHz >= 1500 ? 'warm' : 'velvet';
}

function movementWord(sectionChangeDensity: number): string {
  return sectionChangeDensity >= 0.6 ? 'shifting' : sectionChangeDensity >= 0.3 ? 'flowing' : 'suspended';
}

export function mapFeaturesToIntake(features: AudioFeatures): CreativeIntake {
  const energy = energyWord(features.rmsEnergy);
  const brightness = brightnessWord(features.spectralCentroidHz);
  const movement = movementWord(features.sectionChangeDensity);
  const tempo = Math.round(features.tempoBpm);
  const atmosphere = `${brightness}, ${energy}, and ${movement}`;
  const motifs = [
    brightness === 'luminous' ? 'prism' : brightness === 'warm' ? 'lantern' : 'velvet horizon',
    energy === 'kinetic' ? 'pulse' : energy === 'steady' ? 'current' : 'drift',
    movement === 'shifting' ? 'threshold' : movement === 'flowing' ? 'river' : 'still room',
  ];

  return {
    mapperVersion: '1.0.0',
    disclaimer,
    atmosphere,
    symbolicMotifs: motifs,
    dreamSeeds: [
      `A ${motifs[0]} keeps time with a ${tempo} BPM ${motifs[1]}.`,
      `Walk through a ${motifs[2]} where every sound changes the color of the air.`,
      `Follow a ${brightness} signal until it becomes a scene you can describe.`,
    ],
    ideaPrompts: [
      `Turn the ${motifs[1]} into a three-act visual score with a ${movement} transition.`,
      `Write a short scene where a ${motifs[0]} reveals a hidden map through rhythm.`,
      `Design an interaction that translates ${energy} energy into a tactile ritual.`,
    ],
    promptFragments: [
      `${brightness} ${energy} atmosphere`,
      `${motifs[0]} and ${motifs[1]} in motion`,
      `${movement} dream architecture`,
    ],
    featureManifest: features,
  };
}
