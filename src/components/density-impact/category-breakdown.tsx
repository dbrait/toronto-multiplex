'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CATEGORY_COLORS } from '@/lib/constants';

interface CategoryData {
  category: string;
  units: number;
  permits: number;
  percentage: number;
}

interface CategoryBreakdownProps {
  data: CategoryData[];
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  // Format category name for display
  const formatCategory = (category: string) => {
    return category
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const chartData = data.map((d) => ({
    name: formatCategory(d.category),
    value: d.units,
    category: d.category,
    permits: d.permits,
    percentage: d.percentage,
  }));

  const COLORS = data.map((d) => CATEGORY_COLORS[d.category] || '#6b7280');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Units by Permit Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    typeof value === 'number' ? `${value.toLocaleString()} units` : value,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdown List */}
          <div className="space-y-3">
            {data.map((category) => (
              <div key={category.category}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[category.category] || '#6b7280' }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {formatCategory(category.category)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      {category.units.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({category.percentage}%)
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${category.percentage}%`,
                      backgroundColor: CATEGORY_COLORS[category.category] || '#6b7280',
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {category.permits.toLocaleString()} permits
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
