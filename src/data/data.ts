import animals from "./animals.json";
import entrances from "./entrances.json";
import gifts from "./gifts.json";
import litter from "./litter.json";
import levels from "./levels.json";

export type Animal = { screen: string; x: number; y: number };

export const Animals: Record<string, Animal> = animals;

export type Entrance = {
  direction: string | null;
  screen: string;
  x: number;
  y: number;
  to: string | null;
};

export const Entrances: Record<string, Entrance> = entrances;

export type Gift = {
  name: string;
  screen: string;
  x: number;
  y: number;
  npc?: boolean;
  treasure?: boolean;
  oats?: boolean;
};

export const Gifts: Record<string, Gift> = gifts;

export type OneLitter = { screen: string; x: number; y: number; npc?: boolean };

export const Litter: Record<string, OneLitter> = litter;

export const Levels: Record<string, number[][]> = levels;

export const OatsGifts: Record<string, string> = {
  gift_oats1: "Shades",
  gift_oats2: "Tinted Shades",
  gift_oats3: "Line Shades",
  gift_oats4: "Big Shades",
  gift_oats5: "Rim Shades",
  gift_oats6: "Aviators",
  gift_oats7: "Superstar",
};

export const ExtraSaveKeys: string[] = [
  "basilthanks",
  "fennelquest",
  "giaclitter",
  "olivequest",
  "party_quest",
  "beansreward",
];
