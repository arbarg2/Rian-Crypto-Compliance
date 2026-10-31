
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Mail, Lock, UserPlus, LogIn, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { lovable } from '@/integrations/lovable/index';

export function AuthPage() {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle state from EarlyAccessModal
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const nextParam = new URLSearchParams(location.search).get('next');
  const safeNext = nextParam && /^\/(?!\/)/.test(nextParam) ? nextParam : null;

  useEffect(() => {
    if (user) {
      const storedNext = sessionStorage.getItem('post_auth_next');
      sessionStorage.removeItem('post_auth_next');
      const target = safeNext || (storedNext && /^\/(?!\/)/.test(storedNext) ? storedNext : null);
      if (target) {
        window.location.href = target;
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate, safeNext]);

  const handleOAuth = async (provider: 'google' | 'microsoft') => {
    setIsLoading(true);
    if (safeNext) sessionStorage.setItem('post_auth_next', safeNext);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin + '/auth',
    });
    if (result.error) {
      setIsLoading(false);
      toast({
        title: 'Sign-in failed',
        description: result.error.message || 'Please try again.',
        variant: 'destructive',
      });
      return;
    }
    if (result.redirected) return;
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      console.error('Sign in error:', error);
      let errorMessage = error.message;
      
      // Provide more helpful error messages
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. If you just signed up, please check your email to verify your account first.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the verification link before signing in.';
      }
      
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "Successfully signed in to Rìan",
      });
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error, needsVerification } = await signUp(email, password);
    
    if (error) {
      console.error('Sign up error:', error);
      let errorMessage = error.message;
      
      if (error.message.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      }
      
      toast({
        title: "Sign Up Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      if (needsVerification) {
        setSignupSuccess(true);
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account before signing in.",
        });
      } else {
        // If no verification needed, user should be automatically signed in
        toast({
          title: "Account Created!",
          description: "Welcome to Rìan! Redirecting to dashboard...",
        });
      }
    }
    
    setIsLoading(false);
  };

  const handleBackToSignIn = () => {
    setSignupSuccess(false);
    setActiveTab('signin');
    setPassword(''); // Keep email for convenience
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header with back button */}
      <header className="border-b border-slate-200/50 bg-white/90 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                <span className="text-blue-600 dark:text-blue-400">Rìan</span>
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Auth Form */}
      <div className="flex items-center justify-center p-4 pt-16">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur shadow-xl border-0 dark:bg-slate-900/90">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-10 h-10 text-blue-600 dark:text-blue-400 mr-3" />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                <span className="text-blue-600 dark:text-blue-400">Rìan</span>
              </h1>
            </div>
            <CardTitle className="text-xl text-slate-700 dark:text-slate-300">
              Blockchain Intelligence Platform
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {signupSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Check Your Email
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  We've sent a verification link to <strong>{email}</strong>. 
                  Please click the link in your email to verify your account.
                </p>
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    After verifying your email, return here to sign in with your credentials.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={handleBackToSignIn}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin" className="flex items-center">
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="flex items-center">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="dark:bg-slate-800 dark:border-slate-600"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="flex items-center">
                        <Lock className="w-4 h-4 mr-2" />
                        Password
                      </Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="dark:bg-slate-800 dark:border-slate-600"
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="dark:bg-slate-800 dark:border-slate-600"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="flex items-center">
                        <Lock className="w-4 h-4 mr-2" />
                        Password
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password (min 8 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="dark:bg-slate-800 dark:border-slate-600"
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    or continue with
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button type="button" variant="outline" disabled={isLoading} onClick={() => handleOAuth('google')}>
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.5-1.7 4.4-5.35 4.4-3.22 0-5.85-2.67-5.85-5.96S8.78 6.56 12 6.56c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.68 4 14.55 3 12 3 6.98 3 2.9 7.03 2.9 12s4.08 9 9.1 9c5.25 0 8.73-3.69 8.73-8.89 0-.6-.07-1.05-.15-1.51z"/></svg>
                      Google
                    </Button>
                    <Button type="button" variant="outline" disabled={isLoading} onClick={() => handleOAuth('microsoft')}>
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 3h8.5v8.5H3zM12.5 3H21v8.5h-8.5zM3 12.5h8.5V21H3zM12.5 12.5H21V21h-8.5z"/></svg>
                      Microsoft
                    </Button>
                  </div>
                </div>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
