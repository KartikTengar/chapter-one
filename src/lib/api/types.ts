export interface EventPreview {
  id: string;
  title: string;
  category: string;
  venue: string;
  starts_at: string;
  ends_at?: string;
  cover_url?: `/images/${string}`;
  registration_open: boolean;
  featured?: boolean;
  is_demo?: true;
}

export type FeaturedEvent = EventPreview;
