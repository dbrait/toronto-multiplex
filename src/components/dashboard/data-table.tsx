'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CATEGORY_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

interface Permit {
  id: string;
  permitNum: string;
  address: string;
  structureType: string;
  category: string;
  status: string;
  applicationDate: string;
  issuedDate: string | null;
  dwellingUnitsCreated: number;
  processingDays: number | null;
  neighbourhood: string | null;
}

interface DataTableProps {
  data: Permit[];
}

type SortField = 'applicationDate' | 'processingDays' | 'dwellingUnitsCreated';
type SortDirection = 'asc' | 'desc';

export function DataTable({ data }: DataTableProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('applicationDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const filteredAndSorted = useMemo(() => {
    let result = [...data];

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.address.toLowerCase().includes(searchLower) ||
          p.permitNum.toLowerCase().includes(searchLower) ||
          p.neighbourhood?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((p) => {
        if (statusFilter === 'active') {
          return ['Active', 'Permit Issued', 'Under Review'].includes(p.status);
        }
        if (statusFilter === 'completed') {
          return ['Closed', 'Complete', 'Completed'].includes(p.status);
        }
        return true;
      });
    }

    // Apply sort
    result.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      if (sortField === 'applicationDate') {
        aVal = new Date(a.applicationDate).getTime();
        bVal = new Date(b.applicationDate).getTime();
      } else if (sortField === 'processingDays') {
        aVal = a.processingDays || 0;
        bVal = b.processingDays || 0;
      } else if (sortField === 'dwellingUnitsCreated') {
        aVal = a.dwellingUnitsCreated;
        bVal = b.dwellingUnitsCreated;
      }

      return sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
    });

    return result;
  }, [data, search, categoryFilter, statusFilter, sortField, sortDirection]);

  const paginatedData = filteredAndSorted.slice(
    page * pageSize,
    (page + 1) * pageSize
  );
  const totalPages = Math.ceil(filteredAndSorted.length / pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline" />
    ) : (
      <ChevronDown className="h-4 w-4 inline" />
    );
  };

  const categories = [...new Set(data.map((p) => p.category))];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permit Details</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search address, permit #, neighbourhood..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(0);
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat] || cat}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4">
          Showing {paginatedData.length} of {filteredAndSorted.length} permits
        </p>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Address
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Type
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Neighbourhood
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Status
                </th>
                <th
                  className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('applicationDate')}
                >
                  Applied <SortIcon field="applicationDate" />
                </th>
                <th
                  className="text-right py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('dwellingUnitsCreated')}
                >
                  Units <SortIcon field="dwellingUnitsCreated" />
                </th>
                <th
                  className="text-right py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('processingDays')}
                >
                  Days <SortIcon field="processingDays" />
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((permit) => (
                <tr
                  key={permit.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{permit.address}</p>
                      <p className="text-xs text-gray-500">{permit.permitNum}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                      {CATEGORY_LABELS[permit.category] || permit.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {permit.neighbourhood || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        ['Active', 'Permit Issued', 'Under Review'].includes(
                          permit.status
                        )
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {permit.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {formatDate(new Date(permit.applicationDate))}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {permit.dwellingUnitsCreated}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {permit.processingDays ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
