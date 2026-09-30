export interface AudioFeatures {
  version: 1;
  durationSeconds: number;
  rmsEnergy: number;
  tempoBpm: number;
  spectralCentroidHz: number;
  spectralFlux: number;
  sectionChangeDensity: number;
}
