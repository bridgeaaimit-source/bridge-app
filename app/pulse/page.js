import { redirect } from "next/navigation";

// The old Pulse page was a copy of News Pulse; send everyone to the live one.
export default function PulsePage() {
  redirect("/news-pulse");
}
