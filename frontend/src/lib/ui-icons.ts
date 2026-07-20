/** Official Palworld UI icons under /public/images/ui */

export function uiIconPath(name: string): string {
  return `/images/ui/${name}.png`;
}

export const ELEMENT_ICON: Record<string, string> = {
  Fire: uiIconPath("fire"),
  Water: uiIconPath("water"),
  Grass: uiIconPath("grass"),
  Electric: uiIconPath("electric"),
  Ice: uiIconPath("ice"),
  Ground: uiIconPath("ground"),
  Dark: uiIconPath("dark"),
  Dragon: uiIconPath("dragon"),
  Neutral: uiIconPath("neutral"),
};

/** App work skill → UI asset basename */
export const WORK_ICON: Record<string, string> = {
  kindling: uiIconPath("kindling"),
  watering: uiIconPath("watering"),
  electricity: uiIconPath("generating"),
  mining: uiIconPath("mining"),
  lumbering: uiIconPath("logging"),
  cooling: uiIconPath("cooling"),
  medicine: uiIconPath("medicine"),
  transport: uiIconPath("transporting"),
  farming: uiIconPath("farming"),
  planting: uiIconPath("planting"),
  gathering: uiIconPath("gathering"),
  base_worker: uiIconPath("handiwork"),
  extracting: uiIconPath("extracting"),
};

export function elementIconSrc(element: string): string {
  return ELEMENT_ICON[element] ?? ELEMENT_ICON.Neutral!;
}

export function workIconSrc(skill: string): string | null {
  return WORK_ICON[skill] ?? null;
}
