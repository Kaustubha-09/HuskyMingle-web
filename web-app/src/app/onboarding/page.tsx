'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ── Data ─────────────────────────────────────────────────────────────────────

const NU_PROGRAMS = [
  'Computer Science', 'Data Science', 'Cybersecurity', 'Information Systems',
  'Electrical Engineering', 'Mechanical Engineering', 'Chemical Engineering',
  'Biomedical Engineering', 'Civil Engineering', 'Industrial Engineering',
  'Business Administration', 'Finance', 'Marketing', 'Accounting',
  'Biology', 'Chemistry', 'Physics', 'Mathematics', 'Psychology',
  'Communication', 'Political Science', 'Economics', 'Architecture',
  'Pharmacy', 'Nursing', 'Public Health', 'Law', 'Education', 'Music', 'Art',
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year+', 'Graduate', 'PhD', 'Exchange Student'];

const INTERESTS = [
  'AI & Machine Learning', 'Web Development', 'Mobile Apps', 'Cybersecurity',
  'Data Science', 'Robotics', 'Game Development', 'Cloud Computing',
  'Blockchain', 'Open Source', 'Startups & Entrepreneurship', 'Product Design',
  'Research', 'Teaching & Mentoring', 'Networking Events', 'Hackathons',
  'Music', 'Photography', 'Film & Video', 'Art & Design', 'Writing',
  'Sports & Fitness', 'Hiking & Outdoors', 'Travel', 'Cooking', 'Gaming',
  'Campus Events', 'Volunteering', 'Politics & Activism', 'Sustainability',
];

const SKILLS = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Java', 'C++',
  'Go', 'Rust', 'Swift', 'Kotlin', 'Flutter', 'TensorFlow', 'PyTorch',
  'SQL', 'PostgreSQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS', 'GCP',
  'Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Blender',
  'Unity', 'Unreal Engine', 'MATLAB', 'R', 'Statistics',
  'Public Speaking', 'Project Management', 'Agile/Scrum', 'Leadership',
];

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'zh', label: 'Chinese (Mandarin)', flag: '🇨🇳' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'pt', label: 'Portuguese', flag: '🇧🇷' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', label: 'Korean', flag: '🇰🇷' },
  { code: 'it', label: 'Italian', flag: '🇮🇹' },
  { code: 'ru', label: 'Russian', flag: '🇷🇺' },
  { code: 'tr', label: 'Turkish', flag: '🇹🇷' },
  { code: 'vi', label: 'Vietnamese', flag: '🇻🇳' },
  { code: 'th', label: 'Thai', flag: '🇹🇭' },
  { code: 'bn', label: 'Bengali', flag: '🇧🇩' },
  { code: 'ur', label: 'Urdu', flag: '🇵🇰' },
  { code: 'fa', label: 'Persian', flag: '🇮🇷' },
  { code: 'pl', label: 'Polish', flag: '🇵🇱' },
  { code: 'nl', label: 'Dutch', flag: '🇳🇱' },
];

// ── Components ────────────────────────────────────────────────────────────────

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
        selected
          ? 'bg-[#8B0000] text-white border-[#8B0000]'
          : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-[#8B0000]'
      }`}
    >
      {label}
    </button>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full flex-1 transition-all ${
            i < current ? 'bg-[#8B0000]' : i === current ? 'bg-[#8B0000] opacity-50' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        />
      ))}
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [major, setMajor] = useState('');
  const [year, setYear] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(['en']);

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const canAdvance = () => {
    if (step === 0) return major.length > 0 && year.length > 0;
    if (step === 1) return interests.length >= 3;
    if (step === 2) return skills.length >= 2;
    if (step === 3) return languages.length >= 1;
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await api.post('/users/onboarding', { major, year, interests, skills, languages });
      updateUser({ profile: { ...(user?.profile as any), major, interests, skills, languages, hasOnboarded: true } });
      toast.success('Profile set up! Here are your first matches.');
      router.push('/discover');
    } catch {
      toast.error('Failed to save — please try again');
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    {
      title: 'Your program',
      subtitle: 'Tell us what you study at Northeastern',
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Program / Major</label>
            <div className="flex flex-wrap gap-2">
              {NU_PROGRAMS.map(p => (
                <Chip key={p} label={p} selected={major === p} onClick={() => setMajor(major === p ? '' : p)} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Year</label>
            <div className="flex flex-wrap gap-2">
              {YEARS.map(y => (
                <Chip key={y} label={y} selected={year === y} onClick={() => setYear(year === y ? '' : y)} />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Your interests',
      subtitle: 'Pick at least 3 things you care about',
      content: (
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map(i => (
            <Chip key={i} label={i} selected={interests.includes(i)} onClick={() => toggle(interests, setInterests, i)} />
          ))}
        </div>
      ),
    },
    {
      title: 'Your skills',
      subtitle: 'Pick at least 2 things you can do',
      content: (
        <div className="flex flex-wrap gap-2">
          {SKILLS.map(s => (
            <Chip key={s} label={s} selected={skills.includes(s)} onClick={() => toggle(skills, setSkills, s)} />
          ))}
        </div>
      ),
    },
    {
      title: 'Languages you speak',
      subtitle: "We'll show content in your preferred language",
      content: (
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map(({ code, label, flag }) => (
            <button
              key={code}
              type="button"
              onClick={() => toggle(languages, setLanguages, code)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                languages.includes(code)
                  ? 'border-[#8B0000] bg-red-50 dark:bg-red-950 text-[#8B0000]'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
              }`}
            >
              <span className="text-lg">{flag}</span>
              {label}
            </button>
          ))}
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-[#8B0000] rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-[#FFD700] font-bold text-lg">H</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">HuskyMingle</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Welcome{user?.profile?.name ? `, ${user.profile.name.split(' ')[0]}` : ''}! Let's set up your profile.
            </p>
          </div>
        </div>

        <StepIndicator current={step} total={steps.length} />

        <div className="mb-6">
          <h1 className="text-2xl font-bold">{current.title}</h1>
          <p className="text-gray-500 mt-1 text-sm">{current.subtitle}</p>
        </div>

        {/* Selection counts for steps 1+2 */}
        {step === 1 && interests.length > 0 && (
          <p className="text-xs text-[#8B0000] font-medium mb-3">{interests.length} selected</p>
        )}
        {step === 2 && skills.length > 0 && (
          <p className="text-xs text-[#8B0000] font-medium mb-3">{skills.length} selected</p>
        )}

        <div className="mb-8">{current.content}</div>

        <div className="flex items-center justify-between sticky bottom-6">
          <button
            type="button"
            onClick={() => step > 0 && setStep(step - 1)}
            disabled={step === 0}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 disabled:opacity-30 transition-opacity"
          >
            Back
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => canAdvance() && setStep(step + 1)}
              disabled={!canAdvance()}
              className="px-8 py-2.5 bg-[#8B0000] text-white rounded-xl font-semibold text-sm hover:bg-[#6b0000] transition-colors disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={!canAdvance() || saving}
              className="px-8 py-2.5 bg-[#8B0000] text-white rounded-xl font-semibold text-sm hover:bg-[#6b0000] transition-colors disabled:opacity-40 flex items-center gap-2"
            >
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Find my matches
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
