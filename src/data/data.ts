import animals from "./animals.json";
import entrances from "./entrances.json";
import gifts from "./gifts.json";
import litter from "./litter.json";
import levels from "./levels.json";

export const Animals: {
  [key: string]: { screen: string; x: number; y: number };
} = animals;

export const Entrances: {
  [key: string]: {
    direction: string | null;
    screen: string;
    x: number;
    y: number;
    to: string | null;
  };
} = entrances;

export const Gifts: {
  [key: string]: { name: string; screen: string; x: number; y: number };
} = gifts;

export const Litter: {
  [key: string]: { screen: string; x: number; y: number };
} = litter;

export const Levels: Record<string, number[][]> = levels;
