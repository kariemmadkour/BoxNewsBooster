export interface EarthUniforms {
  uDayTex: { value: any };
  uNightTex: { value: any };
  uSunDirection: { value: any };
  uCloudTex: { value: any };
  uCloudOffset: { value: number };
  uCloudOpacity: { value: number };
  uAtmosphereColor: { value: any };
}

export interface AtmosphereUniforms {
  uSunDirection: { value: any };
  uAtmosphereColor: { value: any };
}

export interface StarParams {
  position: [number, number, number];
  size: number;
  color: string;
  twinkleSpeed: number;
  phase: number;
}
