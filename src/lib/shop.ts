export type ItemTier = 'common' | 'rare' | 'epic' | 'legendary'

export interface ShopItem {
  id: string
  type: 'title' | 'frame'
  name: string
  price: number
  tier: ItemTier
  frameKey?: string // only for frame items — maps to CSS class
  description?: string
}

// Tier metadata — colours come from Tailwind palette
export const TIER_META: Record<ItemTier, { label: string; color: string; badge: string; ring: string }> = {
  common:    { label: 'Common',    color: 'text-slate-600',  badge: 'bg-slate-100 text-slate-700 border-slate-300',  ring: 'ring-slate-300' },
  rare:      { label: 'Rare',      color: 'text-sky-600',    badge: 'bg-sky-50 text-sky-700 border-sky-300',          ring: 'ring-sky-400'   },
  epic:      { label: 'Epic',      color: 'text-purple-600', badge: 'bg-purple-50 text-purple-700 border-purple-300', ring: 'ring-purple-400' },
  legendary: { label: 'Legendary', color: 'text-amber-600',  badge: 'bg-amber-50 text-amber-700 border-amber-400',    ring: 'ring-amber-400' },
}

export const SHOP_ITEMS: ShopItem[] = [
  // ─── Common titles (cheap, self-deprecating, easy wins) ───
  { id: 'title_blames_clubs',    type: 'title', tier: 'common', name: 'Blames the Clubs',        price: 50  },
  { id: 'title_three_putt',      type: 'title', tier: 'common', name: 'Three Putt King',          price: 50  },
  { id: 'title_needs_practice',  type: 'title', tier: 'common', name: 'Needs More Practice',      price: 75  },
  { id: 'title_sand_trap',       type: 'title', tier: 'common', name: 'Sand Trap Survivor',       price: 75  },
  { id: 'title_wind',            type: 'title', tier: 'common', name: 'Wind Was Strong',          price: 75  },
  { id: 'title_lost_ball',       type: 'title', tier: 'common', name: 'Lost Ball Specialist',     price: 100 },
  { id: 'title_still_playing',   type: 'title', tier: 'common', name: 'Technically Still Playing', price: 100 },
  { id: 'title_mostly_harmless', type: 'title', tier: 'common', name: 'Mostly Harmless',          price: 100 },
  { id: 'title_provisional',     type: 'title', tier: 'common', name: 'Provisional Ball Connoisseur', price: 125 },

  // ─── Rare titles ───
  { id: 'title_grip_it',        type: 'title', tier: 'rare',   name: 'Grip It & Lose It',           price: 175 },
  { id: 'title_delusional',     type: 'title', tier: 'rare',   name: 'Delusional Optimist',         price: 175 },
  { id: 'title_water_hazard',   type: 'title', tier: 'rare',   name: 'Water Hazard Whisperer',      price: 200 },
  { id: 'title_walk_ruiner',    type: 'title', tier: 'rare',   name: 'The Walk Ruiner',             price: 200 },
  { id: 'title_bogey_machine',  type: 'title', tier: 'rare',   name: 'Bogey Machine',               price: 250 },
  { id: 'title_cart_path',      type: 'title', tier: 'rare',   name: 'Cart Path Legend',            price: 250 },

  // ─── Epic titles ───
  { id: 'title_par_never',       type: 'title', tier: 'epic', name: 'Par? Never Heard of Her',     price: 400 },
  { id: 'title_groundskeeper',   type: 'title', tier: 'epic', name: "Groundskeeper's Nightmare",   price: 450 },
  { id: 'title_scorecard_editor',type: 'title', tier: 'epic', name: 'Scorecard Editor',            price: 500 },
  { id: 'title_according_to_me', type: 'title', tier: 'epic', name: "According to Me, I'm Good",   price: 550 },
  { id: 'title_mulligan',        type: 'title', tier: 'epic', name: 'The Mulligan',                price: 600 },

  // ─── Legendary titles ───
  { id: 'title_goat',            type: 'title', tier: 'legendary', name: 'GOAT of BAGAL',            price: 1500, description: 'For those who act the part' },
  { id: 'title_ultimate_master', type: 'title', tier: 'legendary', name: 'Ultimate Golf Master',     price: 2500, description: 'The pinnacle of delusion' },

  // ─── Frames (cosmetic glow on avatar) ───
  { id: 'frame_gold',     type: 'frame', tier: 'rare',      name: 'Gold Aura',      price: 400,  frameKey: 'gold',     description: 'A warm golden glow' },
  { id: 'frame_ice',      type: 'frame', tier: 'rare',      name: 'Ice Cold',       price: 500,  frameKey: 'ice',      description: 'Cool blue shimmer' },
  { id: 'frame_fire',     type: 'frame', tier: 'epic',      name: 'On Fire',        price: 750,  frameKey: 'fire',     description: 'Burning hot ring' },
  { id: 'frame_rainbow',  type: 'frame', tier: 'epic',      name: 'Rainbow Legend', price: 1000, frameKey: 'rainbow',  description: 'Every colour at once' },
  { id: 'frame_prestige', type: 'frame', tier: 'legendary', name: 'Prestige',       price: 2000, frameKey: 'prestige', description: 'For the truly elite (in your mind)' },
]

export const FRAME_ITEMS = SHOP_ITEMS.filter((i) => i.type === 'frame')
export const TITLE_ITEMS = SHOP_ITEMS.filter((i) => i.type === 'title')

export const TIER_ORDER: ItemTier[] = ['legendary', 'epic', 'rare', 'common']

export function getItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id)
}
