import { type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
  color?: "default" | "red" | "yellow" | "green" | "blue";
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color = "default",
}: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3
            className={cn(
              "text-2xl font-bold mt-2",
              color === "red" && "text-red-600",
              color === "yellow" && "text-yellow-600",
              color === "green" && "text-green-600",
              color === "blue" && "text-blue-600",
              color === "default" && "text-gray-900",
            )}
          >
            {value}
          </h3>
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
        </div>
        <div
          className={cn(
            "p-3 rounded-full",
            color === "red" && "bg-red-50 text-red-600",
            color === "yellow" && "bg-yellow-50 text-yellow-600",
            color === "green" && "bg-green-50 text-green-600",
            color === "blue" && "bg-blue-50 text-blue-600",
            color === "default" && "bg-gray-100 text-gray-600",
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
