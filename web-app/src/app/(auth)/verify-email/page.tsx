'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const userId = params.get('userId') ?? '';
  const email = params.get('email') ?? '';

  const { verifyEmail, resendVerification, isLoading } = useAuthStore();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleDigit = (i: number, val: string) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setDigits(text.split(''));
      refs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    try {
      await verifyEmail(userId, code);
      toast.success('Email verified! Welcome to HuskyMingle!');
      router.push('/');
    } catch (err: any) {
      toast.error(err.message);
      setDigits(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    try {
      await resendVerification(userId);
      toast.success('New code sent!');
      setResendCooldown(60);
      setDigits(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } catch {
      toast.error('Failed to resend code');
    }
  };

  return (
    <div className="w-full max-w-sm text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-[#8B0000] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">📧</span>
        </div>
        <h1 className="text-2xl font-bold">Check your inbox</h1>
        <p className="text-gray-500 mt-2 text-sm">
          We sent a 6-digit code to<br />
          <span className="font-semibold text-gray-700 dark:text-gray-300">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { refs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:outline-none focus:border-[#8B0000] transition-colors"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading || digits.join('').length < 6}
          className="w-full py-3 bg-[#8B0000] text-white rounded-xl font-semibold hover:bg-[#6b0000] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          Verify Email
        </button>
      </form>

      <div className="mt-6">
        <p className="text-sm text-gray-500 mb-2">Didn&apos;t get the code?</p>
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="text-sm text-[#8B0000] font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
        </button>
      </div>

      <p className="mt-6 text-xs text-gray-400">
        Only @northeastern.edu addresses can join HuskyMingle
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
