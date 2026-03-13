import { cn } from "@/lib/utils"
import type { RiskLevel } from "@/lib/types"

const riskConfig: Record<string, { label: string; className: string }> = {
  red: {
    label: "High Risk",
    className: "bg-risk-red-bg text-risk-red border-risk-red/20",
  },
  yellow: {
    label: "Medium Risk",
    className: "bg-risk-yellow-bg text-risk-yellow border-risk-yellow/20",
  },
  green: {
    label: "Low Risk",
    className: "bg-risk-green-bg text-risk-green border-risk-green/20",
  },
}

// CLEVER FIX: Normalize whatever string comes from the database/ML engine
const normalizeLevel = (rawLevel?: string | null): string => {
  if (!rawLevel) return "green"; // Fallback to green if missing
  const lower = rawLevel.toLowerCase();
  
  if (lower.includes("red") || lower.includes("high") || lower.includes("critical")) return "red";
  if (lower.includes("yellow") || lower.includes("medium") || lower.includes("moderate")) return "yellow";
  
  return "green"; // Default fallback
};

export function RiskBadge({
  level,
  showLabel = true,
  className,
}: {
  level?: string | RiskLevel // Loosen the type to accept raw DB strings
  showLabel?: boolean
  className?: string
}) {
  const safeLevel = normalizeLevel(level)
  const config = riskConfig[safeLevel]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.className,
        className
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", {
          "bg-risk-red": safeLevel === "red",
          "bg-risk-yellow": safeLevel === "yellow",
          "bg-risk-green": safeLevel === "green",
        })}
      />
      {showLabel && config.label}
    </span>
  )
}