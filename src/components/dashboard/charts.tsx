'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/constants';

interface TrendData {
  month: string;
  count: number;
  category: string;
}

interface CategoryData {
  category: string;
  count: number;
  units: number;
}

interface ProcessingData {
  range: string;
  count: number;
}

interface NeighbourhoodData {
  name: string;
  totalPermits: number;
  activePermits: number;
  completedPermits: number;
  totalUnitsCreated: number;
}

interface ChartsProps {
  trends: TrendData[];
  categories: CategoryData[];
  processing: ProcessingData[];
  neighbourhoods: NeighbourhoodData[];
}

export function TrendsChart({ data }: { data: TrendData[] }) {
  // Aggregate by month
  const aggregated = data.reduce(
    (acc, item) => {
      if (!acc[item.month]) {
        acc[item.month] = { month: item.month, total: 0 } as Record<string, number | string>;
      }
      (acc[item.month] as Record<string, number | string>).total =
        ((acc[item.month] as Record<string, number | string>).total as number) + item.count;
      (acc[item.month] as Record<string, number | string>)[item.category] = item.count;
      return acc;
    },
    {} as Record<string, Record<string, number | string>>
  );

  const chartData = Object.values(aggregated).sort((a, b) =>
    (a.month as string).localeCompare(b.month as string)
  );

  // Get unique categories
  const categories = [...new Set(data.map((d) => d.category))];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permit Applications Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const [year, month] = value.split('-');
                  return `${month}/${year.slice(2)}`;
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={(value) => {
                  const [year, month] = (value as string).split('-');
                  const date = new Date(parseInt(year), parseInt(month) - 1);
                  return date.toLocaleDateString('en-CA', {
                    year: 'numeric',
                    month: 'long',
                  });
                }}
              />
              <Legend />
              {categories.map((category) => (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={category}
                  name={CATEGORY_LABELS[category] || category}
                  stroke={CATEGORY_COLORS[category] || '#6b7280'}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function CategoryPieChart({ data }: { data: CategoryData[] }) {
  const chartData = data.map((d) => ({
    name: CATEGORY_LABELS[d.category] || d.category,
    value: d.count,
    color: CATEGORY_COLORS[d.category] || '#6b7280',
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permits by Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={60}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                }
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProcessingTimeChart({ data }: { data: ProcessingData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Processing Time Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="range"
                type="category"
                tick={{ fontSize: 12 }}
                width={100}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function NeighbourhoodChart({ data }: { data: NeighbourhoodData[] }) {
  // Take top 10 neighbourhoods
  const topNeighbourhoods = data.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Neighbourhoods by Permits</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topNeighbourhoods} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11 }}
                width={180}
              />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="activePermits"
                name="Active"
                fill="#3b82f6"
                stackId="a"
              />
              <Bar
                dataKey="completedPermits"
                name="Completed"
                fill="#10b981"
                stackId="a"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function AllCharts({ trends, categories, processing, neighbourhoods }: ChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="lg:col-span-2">
        <TrendsChart data={trends} />
      </div>
      <CategoryPieChart data={categories} />
      <ProcessingTimeChart data={processing} />
      <div className="lg:col-span-2">
        <NeighbourhoodChart data={neighbourhoods} />
      </div>
    </div>
  );
}
