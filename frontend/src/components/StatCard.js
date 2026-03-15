'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

export default function StatCard({ 
  title, 
  value, 
  icon, 
  trend,
  trendLabel,
  color = 'blue',
  link
}) {
  const CardWrapper = link ? Link : 'div';
  
  return (
    <CardWrapper 
      href={link || '#'}
      className={`bg-white rounded-lg shadow p-6 ${link ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          
          {trend !== undefined && (
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">
                {trend} {trendLabel}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          {icon}
        </div>
      </div>
    </CardWrapper>
  );
}
