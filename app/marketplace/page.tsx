'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CarbonCredit {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: string;
  verified: boolean;
}

export default function Marketplace() {
  const [credits] = useState<CarbonCredit[]>([
    {
      id: '1',
      name: 'Rainforest Conservation',
      price: 25,
      quantity: 100,
      type: 'Forest',
      verified: true,
    },
    {
      id: '2',
      name: 'Wind Energy Project',
      price: 20,
      quantity: 150,
      type: 'Renewable Energy',
      verified: true,
    },
    {
      id: '3',
      name: 'Ocean Conservation',
      price: 30,
      quantity: 75,
      type: 'Marine',
      verified: true,
    },
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Carbon Credit Marketplace</h1>
        <div className="flex gap-4">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="forest">Forest</SelectItem>
              <SelectItem value="renewable">Renewable Energy</SelectItem>
              <SelectItem value="marine">Marine</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="quantity">Quantity Available</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {credits.map((credit) => (
          <Card key={credit.id}>
            <CardHeader>
              <CardTitle>{credit.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">${credit.price}</p>
                <p className="text-muted-foreground">
                  Available: {credit.quantity} credits
                </p>
                <p className="text-muted-foreground">Type: {credit.type}</p>
                <div className="flex justify-between items-center mt-4">
                  <Button>Buy Now</Button>
                  <Button variant="outline">View Details</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}