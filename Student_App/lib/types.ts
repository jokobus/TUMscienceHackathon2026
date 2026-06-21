/**
 * types.ts — the Student web app's view-model contract.
 * Events are snake_case (matching the backend wire shape); dates are ISO strings.
 */
export type EventType = string;

export interface Event {
  id: string;
  title: string;
  description: string;
  start_at: string; // ISO 8601
  end_at: string; // ISO 8601
  type: EventType;
  city: string | null;
  location: string | null;
  image_url: string | null;
  application_required: boolean;
}
