import { redirect } from "next/navigation";

// The terminal home is the dashboard.
export default function HomePage() {
  redirect("/dashboard");
}
