export interface Circle {
  id: string;
  name: string;
  description: string;
  status: string;
  member_count: number;
  created_at: string;
}

export interface Proposal {
  id: string;
  circle_id: string;
  title: string;
  description: string;
  status: string;
  votes_for: number;
  votes_against: number;
  created_at: string;
  deadline: string;
}

export interface Vote {
  voter_address: string;
  vote: string;
  weight: string;
  timestamp: string;
}

export interface VoteBreakdown {
  proposal_id: string;
  total_votes: number;
  votes_for: number;
  votes_against: number;
  votes: Vote[];
}
