import { ExecutiveDashboard } from "@/components/ExecutiveDashboard";
import { sampleMessages } from "@/data/sampleMessages";

export default function HomePage() {
  return <ExecutiveDashboard initialMessages={sampleMessages} />;
}
