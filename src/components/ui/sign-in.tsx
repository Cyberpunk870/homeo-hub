import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMember } from '@/integrations';

interface SignInProps {
  title?: string;
  message?: string;
  className?: string;
  cardClassName?: string;
  buttonClassName?: string;
  buttonText?: string;
}

export function SignIn({
  title = 'Doctor Sign In',
  message = 'Use the doctor credentials configured for this deployment.',
  className = 'min-h-screen flex items-center justify-center px-4',
  cardClassName = 'w-full max-w-md mx-auto text-foreground',
  buttonClassName = 'w-full h-10',
  buttonText = 'Sign In',
}: SignInProps) {
  const { actions, error, isLoading } = useMember();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const result = await actions.login({ email, password });
    if (!result.success) {
      setFormError(result.error ?? 'Invalid credentials');
      return;
    }

    setPassword('');
  };

  return (
    <div className={className}>
      <Card className={cardClassName}>
        <CardHeader className="text-center space-y-4 py-10 px-10">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="px-10 pb-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doctor-email">Email</Label>
              <Input
                id="doctor-email"
                autoComplete="username"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctor-password">Password</Label>
              <Input
                id="doctor-password"
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {(formError || error) && (
              <p className="text-sm text-destructive">{formError || error}</p>
            )}
            <Button type="submit" disabled={isLoading} className={buttonClassName}>
              {isLoading ? 'Signing In...' : buttonText}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
