export interface Journal {
  id: number;
  user_id: number;
  title: string | null;
  content: string;
  mood: string | null;
  tags: string | null;
  tags_array: string[];
  entry_date: string;
  template_used: string | null;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface JournalPrompt {
  id: number;
  prompt: string;
  followUp: string;
  category: string;
}

export interface JournalTemplate {
  id: string;
  name: string;
  description: string;
  sections: {
    title: string;
    prompt: string;
  }[];
}

export interface MoodOption {
  value: string;
  label: string;
  emoji: string;
  color: string;
}

export interface JournalStats {
  totalEntries: number;
  totalWords: number;
  entriesThisMonth: number;
  currentStreak: number;
  moodDistribution: {
    mood: string;
    count: number;
  }[];
}

export interface JournalFilters {
  page?: number;
  limit?: number;
  mood?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}