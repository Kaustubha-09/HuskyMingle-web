'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({
    username: '', email: '', password: '', name: '', major: '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email.endsWith('@northeastern.edu')) {
      toast.error('Only @northeastern.edu emails are allowed');
      return;
    }

    try {
      const { userId, email } = await register({
        ...form,
        university: 'Northeastern University',
      });
      toast.success('Account created! Check your email for the verification code.');
      router.push(`/verify-email?userId=${userId}&email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <div className="w-12 h-12 bg-[#8B0000] rounded-xl flex items-center justify-center mb-4">
          <span className="text-[#FFD700] font-bold text-xl">H</span>
        </div>
        <h1 className="text-2xl font-bold">Join HuskyMingle</h1>
        <p className="text-gray-500 mt-1 text-sm">Northeastern University students only</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {[
          { key: 'name', label: 'Full Name', placeholder: 'John Doe', type: 'text' },
          { key: 'username', label: 'Username', placeholder: 'john_doe', type: 'text' },
          { key: 'password', label: 'Password', placeholder: '8+ characters', type: 'password' },
          { key: 'major', label: 'Major (optional)', placeholder: 'Computer Science', type: 'text' },
        ].map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{label}</label>
            <input
              type={type}
              value={form[key as keyof typeof form]}
              onChange={set(key)}
              placeholder={placeholder}
              required={key !== 'major'}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000] focus:border-transparent"
            />
          </div>
        ))}

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
            NU Email
          </label>
          <div className="relative">
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="husky@northeastern.edu"
              required
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000] focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Must end in @northeastern.edu</p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-[#8B0000] text-white rounded-lg text-sm font-semibold hover:bg-[#6b0000] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
        >
          {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          Create Account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-[#8B0000] font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
