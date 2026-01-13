'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, Clock, Activity, Building2, Info } from 'lucide-react';
import type { FeasibilityScore, FeasibilityFactor } from '@/lib/scoring';

interface FactorBreakdownProps {
  score: FeasibilityScore;
}

const factorConfig = {
  approvalRate: {
    label: 'Approval Rate',
    icon: CheckCircle2,
    color: '#10b981',
    weight: '30%',
  },
  processingSpeed: {
    label: 'Processing Speed',
    icon: Clock,
    color: '#3b82f6',
    weight: '30%',
  },
  activityLevel: {
    label: 'Activity Level',
    icon: Activity,
    color: '#8b5cf6',
    weight: '20%',
  },
  aduDensity: {
    label: 'ADU Density',
    icon: Building2,
    color: '#f59e0b',
    weight: '20%',
  },
};

export function FactorBreakdown({ score }: FactorBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5 text-gray-400" />
          Score Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(factorConfig) as Array<keyof typeof factorConfig>).map((key) => {
            const config = factorConfig[key];
            const factor = score.factors[key] as FeasibilityFactor;
            const Icon = config.icon;

            return (
              <FactorCard
                key={key}
                label={config.label}
                icon={<Icon className="w-5 h-5" style={{ color: config.color }} />}
                score={factor.score}
                value={factor.value}
                description={factor.description}
                weight={config.weight}
                color={config.color}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            <strong>How we calculate the score:</strong> Each factor is weighted and combined to create
            your overall feasibility score. Higher scores in each factor indicate more favorable conditions
            for ADU development based on historical permit data in this neighbourhood.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface FactorCardProps {
  label: string;
  icon: React.ReactNode;
  score: number;
  value: string;
  description: string;
  weight: string;
  color: string;
}

function FactorCard({ label, icon, score, value, description, weight, color }: FactorCardProps) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-gray-900">{label}</span>
        </div>
        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">
          {weight} weight
        </span>
      </div>

      {/* Score Bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">{value}</span>
          <span className="font-semibold" style={{ color }}>
            {score}/100
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${score}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}
