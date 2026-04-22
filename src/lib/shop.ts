export interface ShopItem {
  id: string
  type: 'title' | 'frame'
  name: string
  price: number
  frameKey?: string // only for frame items — maps to CSS class
  description?: string
}

export const SHOP_ITEMS: ShopItem[] = [
  // --- Titles ---
  { id: 'title_blames_clubs',      type: 'title', name: 'Blames the Clubs',              price: 50  },
  { id: 'title_three_putt',        type: 'title', name: 'Three Putt King',                price: 50  },
  { id: 'title_needs_practice',    type: 'title', name: 'Needs More Practice',            price: 75  },
  { id: 'title_sand_trap',         type: 'title', name: 'Sand Trap Survivor',             price: 75  },
  { id: 'title_lost_ball',         type: 'title', name: 'Lost Ball Specialist',           price: 100 },
  { id: 'title_wind',              type: 'title', name: 'Wind Was Strong',                price: 100 },
  { id: 'title_still_playing',     type: 'title', name: 'Technically Still Playing',      price: 100 },
  { id: 'title_mostly_harmless',   type: 'title', name: 'Mostly Harmless',                price: 100 },
  { id: 'title_provisional',       type: 'title', name: 'Provisional Ball Connoisseur',   price: 100 },
  { id: 'title_grip_it',           type: 'title', name: 'Grip It & Lose It',              price: 150 },
  { id: 'title_delusional',        type: 'title', name: 'Delusional Optimist',            price: 150 },
  { id: 'title_walk_ruiner',       type: 'title', name: 'The Walk Ruiner',                price: 150 },
  { id: 'title_water_hazard',      type: 'title', name: 'Water Hazard Whisperer',         price: 150 },
  { id: 'title_bogey_machine',     type: 'title', name: 'Bogey Machine',                  price: 200 },
  { id: 'title_par_never',         type: 'title', name: 'Par? Never Heard of Her',        price: 200 },
  { id: 'title_cart_path',         type: 'title', name: 'Cart Path Legend',               price: 200 },
  { id: 'title_groundskeeper',     type: 'title', name: "Groundskeeper's Nightmare",      price: 250 },
  { id: 'title_scorecard_editor',  type: 'title', name: 'Scorecard Editor',               price: 300 },
  { id: 'title_according_to_me',   type: 'title', name: "According to Me, I'm Good",      price: 300 },
  { id: 'title_mulligan',          type: 'title', name: 'The Mulligan',                   price: 350 },

  // --- Frames ---
  { id: 'frame_gold',     type: 'frame', name: 'Gold Aura',      price: 300,  frameKey: 'gold',     description: 'A warm golden glow' },
  { id: 'frame_ice',      type: 'frame', name: 'Ice Cold',       price: 400,  frameKey: 'ice',      description: 'Cool blue shimmer' },
  { id: 'frame_fire',     type: 'frame', name: 'On Fire',        price: 500,  frameKey: 'fire',     description: 'Burning hot ring' },
  { id: 'frame_rainbow',  type: 'frame', name: 'Rainbow Legend', price: 750,  frameKey: 'rainbow',  description: 'Every colour at once' },
  { id: 'frame_prestige', type: 'frame', name: 'Prestige',       price: 1000, frameKey: 'prestige', description: 'For the truly delusional' },
]

export const FRAME_ITEMS   = SHOP_ITEMS.filter((i) => i.type === 'frame')
export const TITLE_ITEMS   = SHOP_ITEMS.filter((i) => i.type === 'title')

export function getItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id)
}
