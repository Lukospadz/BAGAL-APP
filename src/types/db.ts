export type PlayerRole = 'admin' | 'player'
export type SeasonStatus = 'active' | 'completed'
export type TournamentStatus = 'upcoming' | 'completed'
export type TournamentFormat = 'stroke' | 'match' | 'scramble'

export interface BagContents {
  driver?: string
  woods?: string
  irons?: string
  wedges?: string
  putter?: string
  ball?: string
  notes?: string
}

export interface Player {
  id: string
  name: string
  initials: string
  color: string
  handicap: number | null
  avatar_url: string | null
  bio: string | null
  home_course: string | null
  bag: BagContents
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
