'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Leaf, BarChart3, ShoppingCart, User } from 'lucide-react';
import { ConnectWallet } from '@/components/ConnectWallet';

export default function Navigation() {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <Leaf className="h-8 w-8 text-green-600" />
              <span className="ml-2 text-xl font-bold">CarbonDEX</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/marketplace" className="inline-flex items-center px-1 pt-1 text-sm font-medium">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Marketplace
              </Link>
              <Link href="/analytics" className="inline-flex items-center px-1 pt-1 text-sm font-medium">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <ConnectWallet />
            {isConnected && (
              <Link href="/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}