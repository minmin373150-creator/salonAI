export type UserRole = 'user' | 'admin'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'
export type MessageRole = 'user' | 'assistant'
export type ContactStatus = 'open' | 'resolved'
export type KnowledgeSourceType = 'pdf' | 'text' | 'audio_transcript'

export interface Profile {
  id: string
  email: string
  name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  status: SubscriptionStatus
  plan_id: string
  current_period_end: string
  created_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  messages?: ChatMessage[]
}

export interface ChatMessage {
  id: string
  session_id: string
  role: MessageRole
  content: string
  file_urls: string[] | null
  created_at: string
}

export interface KnowledgeChunk {
  id: string
  title: string
  content: string
  category: string | null
  source_type: KnowledgeSourceType
  source_file: string | null
  created_at: string
}

export interface SystemPrompt {
  id: string
  version: number
  prompt_text: string
  is_active: boolean
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  is_published: boolean
  published_at: string | null
  created_at: string
}

export interface Contact {
  id: string
  user_id: string | null
  name: string
  email: string
  subject: string
  message: string
  status: ContactStatus
  created_at: string
}
