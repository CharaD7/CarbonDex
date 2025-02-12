import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Leaf, TrendingUp, Shield } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-background to-secondary">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">
            Decentralized Carbon Credit Marketplace
          </h1>
          <p className="text-xl mb-8 text-muted-foreground">
            Trade carbon credits securely and transparently on the blockchain
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/marketplace">
              <Button size="lg">
                Start Trading
              </Button>
            </Link>
            <Link href="/learn">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <Leaf className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Credits</h3>
              <p className="text-muted-foreground">
                All carbon credits are verified using blockchain technology
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <TrendingUp className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Market Analytics</h3>
              <p className="text-muted-foreground">
                AI-powered insights and predictive modeling
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <Shield className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Trading</h3>
              <p className="text-muted-foreground">
                Enterprise-grade security for all transactions
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}