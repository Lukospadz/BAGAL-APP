export type PlayerRole = 'admin' | 'player'
export type SeasonStatus = 'active' | 'completed'
export type TournamentStatus = 'upcoming' | 'completed'
export type TournamentFormat = 'stroke' | 'match' | 'scramble'

export interface BagItem {
  type: string        // e.g. 'Driver', 'Wedge', 'Putter'
  description: string // free-form, e.g. 'TaylorMade Stealth 2 9°'
}

// Back-compat — old bag shape (pre-migration); new bag is BagItem[]
export type Bag = BagItem[]

export interface Player {
  id: string
  name: string
  initials: string
  color: string
  handicap: number | null
  avatar_url: string | null
  bio: string | null
  home_course: string | null
  bag: Bag
  bagal_bucks: number
  active_title: string | null
  active_frame: string | null
  created_at: string
}

export interface Profile {
  id: string
  role: PlayerRole
  player_id: string | null
  created_at: string
}

export interface Season {
  id: string
  name: string
  year: number
  start_date: string | null
  end_date: string | null
  status: SeasonStatus
  champion_player_id: string | null
  created_at: string
}

export interface Tournament {
  id: string
  season_id: string
  name: string
  date: string | null
  course: string | null
  course_rating: number | null
  format: TournamentFormat
  par: number | null
  holes: number
  rounds: number
  status: TournamentStatus
  points_1st: number
  points_2nd: number
  points_3rd: number
  sort_order: number
  notes: string | null
  bucks_awarded: boolean
  created_at: string
}

export interface Score {
  id: string
  tournament_id: string
  player_id: string
  round_number: number
  gross_score: number
  position: number | null
  points_awarded: number
  notes: string | null
  created_at: string
}

export interface CasualRound {
  id: string
  season_id: string
  date: string
  course: string | null
  winner_player_id: string
  points_awarded: number
  notes: string | null
  created_at: string
}

export interface PersonalRound {
  id: string
  player_id: string
  date: string
  course: string
  course_rating: number | null
  score: number | null
  par: number | null
  notes: string | null
  created_at: string
}

export interface BucksTransaction {
  id: string
  player_id: string
  amount: number
  reason: string
  created_at: string
}

export interface PlayerItem {
  id: string
  player_id: string
  item_id: string
  item_type: 'title' | 'frame'
  item_name: string
  purchased_at: string
}

export type PropBetType =
  | 'winner' | 'hole_in_one' | 'defend'
  | 'personal_best' | 'big_margin' | 'tie_game' | 'close_finish'
  | 'water_ball' | 'tilt' | 'front_nine_choke'
  | 'duff_tee' | 'birdie' | 'multi_birdie' | 'lost_balls' | 'bunker_escape'
  | 'snowman' | 'four_putt' | 'three_putt_18' | 'double_ob' | 'blade_chip' | 'skull_ob'
  | 'custom'
export type PropBetStatus = 'open' | 'settled' | 'voided'
export type PlayerBetStatus = 'pending' | 'won' | 'lost' | 'voided'

export interface PropBet {
  id: string
  tournament_id: string
  type: PropBetType
  description: string
  target_player_id: string | null
  odds: number
  status: PropBetStatus
  result: boolean | null
  created_at: string
}

export interface PlayerBet {
  id: string
  prop_bet_id: string
  player_id: string
  amount: number
  potential_payout: number
  status: PlayerBetStatus
  created_at: string
  settled_at: string | null
}

export interface FavouriteCourse {
  id: string
  player_id: string
  rank: number
  name: string
  photo_url: string | null
  notes: string | null
  created_at: string
}
