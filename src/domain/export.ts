import type { CreativeIntake } from './artifact';

export function serializeIntakeAsJson(intake: CreativeIntake): string {
  return `${JSON.stringify(intake, null, 2)}\n`;
}

export function serializeIntakeAsMarkdown(intake: CreativeIntake): string {
  return [
    '# CryptoJukebox creative intake',
    '',
    `> ${intake.disclaimer}`,
    '',
    '## Atmosphere',
    intake.atmosphere,
    '',
    '## Symbolic motifs',
    ...intake.symbolicMotifs.map((motif) => `- ${motif}`),
    '',
    '## Dream seeds',
    ...intake.dreamSeeds.map((seed) => `- ${seed}`),
    '',
    '## Idea prompts',
    ...intake.ideaPrompts.map((prompt) => `- ${prompt}`),
    '',
    '## Prompt fragments',
    ...intake.promptFragments.map((fragment) => `- ${fragment}`),
    '',
    '## Feature manifest',
    '```json',
    JSON.stringify(intake.featureManifest, null, 2),
    '```',
    '',
  ].join('\n');
}
