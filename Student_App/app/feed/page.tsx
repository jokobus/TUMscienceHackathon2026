import { getMockEvents } from "@/lib/data";
import { FeedClient } from "./FeedClient";

export default async function FeedPage() {
  const events = await getMockEvents();

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-24 md:pb-6">
      <FeedClient initialEvents={events} />
    </div>
  );
}
