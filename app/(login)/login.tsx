'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleIcon, Loader2, Github } from 'lucide-react'; // Replaced Github with a generic icon if needed, but keeping for style if used.
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCustomToken,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { createUser, getUser, getInvitation } from '@/lib/firebase/firestore';
import { useEffect } from 'react';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEmailPreFilled, setIsEmailPreFilled] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      if (inviteId && mode === 'signup') {
        try {
          const invite = await getInvitation(inviteId);
          if (invite && invite.status !== 'revoked') {
            setEmail(invite.email);
            setIsEmailPreFilled(true);
          }
        } catch (err) {
          console.error('Error fetching invite:', err);
        }
      }
    };
    fetchInvite();
  }, [inviteId, mode]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let userCredential;
      if (mode === 'signin') {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }

      const idToken = await userCredential.user.getIdToken();
      const endpoint = mode === 'signin' ? '/api/auth/sign-in' : '/api/auth/sign-up';

      const body = {
        idToken,
        redirect,
        priceId: priceId || undefined,
        inviteId: mode === 'signup' ? (inviteId || undefined) : undefined,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Session established via cookie by API, just redirect
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      // Map Firebase error codes to user-friendly messages if needed
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      // We use sign-in endpoint for Google Auth for simplicity, 
      // but sign-up logic might be needed if they are new?
      // Actually, if we use the sign-up endpoint, it checks if user exists and logs them in.
      // IF we use sign-in endpoint, it requires user doc to exist.
      // Safe bet: Use sign-up endpoint for Google Auth if we don't know?
      // OR, try sign-in, if 404, try sign-up?
      // Better: Use a dedicated /api/auth/google or just use sign-up which is idempotent-ish.
      // My refactored sign-up logic: checks if user doc exists -> signs in.
      // So sign-up is safe for existing users too.
      // Let's use sign-up for Google Auth to ensure user doc creation.

      const endpoint = '/api/auth/sign-up';
      // Note: sign-up schema expects idToken.

      const body = {
        idToken,
        redirect,
        inviteId: inviteId || undefined
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // If sign-up fails (maybe logic mismatch), try sign-in?
        // But sign-up covers both.
        const data = await response.json();
        throw new Error(data.error || 'Google Sign In failed');
      }

      const data = await response.json();
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        router.refresh();
      }

    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError('Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CircleIcon className="h-12 w-12 text-orange-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === 'signin'
            ? 'Sign in to your account'
            : 'Create your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleEmailAuth}>
            <div>
              <Label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={50}
                  className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="Enter your email"
                  disabled={isEmailPreFilled}
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </Label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={
                    mode === 'signin' ? 'current-password' : 'new-password'
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  maxLength={100}
                  className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div>
              <Button
                type="submit"
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Loading...
                  </>
                ) : mode === 'signin' ? (
                  'Sign in'
                ) : (
                  'Sign up'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                disabled={loading}
              >
                {/* Google Icon */}
                <svg className="h-5 w-5 mr-2" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {mode === 'signin'
                    ? 'New to our platform?'
                    : 'Already have an account?'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${redirect ? `?redirect=${redirect}` : ''
                  }${priceId ? `&priceId=${priceId}` : ''}`}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                {mode === 'signin'
                  ? 'Create an account'
                  : 'Sign in to existing account'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
