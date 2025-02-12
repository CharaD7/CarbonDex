'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

export function ConnectWallet() {
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = async () => {
    // Wallet connection logic will go here
    setIsConnected(true);
  };

  return (
    <Button
      onClick={handleConnect}
      variant={isConnected ? "outline" : "default"}
      className="ml-4"
    >
      <Wallet className="mr-2 h-4 w-4" />
      {isConnected ? "Connected" : "Connect Wallet"}
    </Button>
  );
}