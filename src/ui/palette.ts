/**
 * The one game palette. CSS variables, canvas art and the recoloured vendor
 * assets (scripts/unify-assets.py) all draw from this list, so every pixel on
 * screen belongs to the same set of colours. Keep in sync with the script.
 */
export const PALETTE = {
  ink: '#2b1d10',
  woodDark: '#5a3f28',
  wood: '#8b5a3c',
  sand: '#c9ac7a',
  line: '#d8c296',
  card2: '#e4d2ac',
  paper: '#efe2c4',
  card: '#fbf4e2',
  light: '#fffaf0',
  tealDark: '#0f4a45',
  teal: '#18665f',
  tealLight: '#2a8a80',
  redDark: '#7e2620',
  red: '#b23a30',
  redLight: '#d9734e',
  amberDark: '#8a5300',
  amber: '#e0a93b',
  amberLight: '#f5c26b',
  greenDark: '#3e7a3a',
  green: '#5fae5f',
  sage: '#9bb58a',
  blueDark: '#2b4566',
  blue: '#3f7fa6',
  sky: '#7fb8d6',
  stone: '#6e6a80',
  stoneLight: '#9a9aa8',
  skin: '#c98a5a',
} as const

export type PaletteName = keyof typeof PALETTE

/** Whole-number scales only: pixel art is never drawn at fractional sizes. */
export const PIXEL_SCALE = { ui: 2, world: 3, map: 2, town: 2 } as const
