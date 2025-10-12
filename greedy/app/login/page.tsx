'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showToast } from '@/lib/toast';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        password,
        redirect: false,
      });

      if (result?.error) {
        showToast.error('Authentication failed', 'Please check your password and try again');
      } else {
        showToast.success('Welcome back!', 'You have been successfully logged in');
        router.push('/');
      }
    } catch (err) {
      showToast.error('An error occurred', 'Please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Greedy Adventure Diary</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-base-300 rounded text-sm">
              <strong>Development Mode:</strong> Any password will work, or leave blank.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}