import { CatalogView } from "@/components/catalog-view";
import { PROBLEMS } from "@/catalog/problems";

export default function HomePage() {
  const problems = PROBLEMS.map((problem) => ({
    id: problem.id,
    title: problem.title,
    difficulty: problem.difficulty,
    minutes: problem.minutes,
    summary: problem.summary,
    tags: problem.tags,
    capabilityCount: problem.capabilities.filter((item) => !item.activatedBy).length,
  }));
  return <CatalogView initialProblems={problems} />;
}
