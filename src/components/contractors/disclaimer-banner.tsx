'use client';

import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function DisclaimerBanner() {
  return (
    <Card className="bg-amber-50 border-amber-200">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800">Experimental Feature</h3>
            <p className="text-sm text-amber-700 mt-1">
              Contractor names are extracted from permit descriptions using pattern matching.
              This data is <strong>not verified</strong> and may contain:
            </p>
            <ul className="text-sm text-amber-700 mt-2 list-disc list-inside space-y-1">
              <li>Incorrect or partial company names</li>
              <li>Property owner names mistaken for contractors</li>
              <li>Duplicate entries for the same company (name variations)</li>
              <li>Missing contractors when descriptions lack company info</li>
            </ul>
            <p className="text-sm text-amber-700 mt-2">
              Use this data for general insights only, not for contractor selection.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
