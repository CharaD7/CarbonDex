'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', price: 20 },
  { name: 'Feb', price: 22 },
  { name: 'Mar', price: 25 },
  { name: 'Apr', price: 23 },
  { name: 'May', price: 28 },
  { name: 'Jun', price: 30 },
];

export default function Analytics() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Market Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$1.2M</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Traders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">2,543</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Average Price</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$25.40</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Price Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}