import { Link } from "react-router-dom";

export default function RiskScoreDisclosure() {
  return (
    <Link
      to="/methodology#risk-score"
      className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
      aria-label="Rìan heuristic risk score: calculation and limitations"
    >
      Rìan heuristic risk score
    </Link>
  );
}