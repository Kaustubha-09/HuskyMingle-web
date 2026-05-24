'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, isPast } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Briefcase,
  MapPin,
  Clock,
  Plus,
  X,
  ChevronLeft,
  Users,
  Tag,
  CalendarDays,
  CheckCircle2,
} from 'lucide-react';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'RESEARCH' | 'VOLUNTEER';
type AppStatus = 'PENDING' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED';

interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  type: JobType;
  location?: string;
  isRemote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  deadline?: string;
  tags: string[];
  hasApplied: boolean;
  applicationStatus?: AppStatus;
  _count: { applications: number };
  createdAt: string;
  poster: { username: string; profile?: { name: string } };
}

interface JobFilters {
  type: string;
  remote: boolean;
  query: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTypeBadge(type: JobType): string {
  switch (type) {
    case 'INTERNSHIP':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'RESEARCH':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    case 'FULL_TIME':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'PART_TIME':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'CONTRACT':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    case 'VOLUNTEER':
      return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300';
  }
}

function getTypeLabel(type: JobType): string {
  const map: Record<JobType, string> = {
    FULL_TIME: 'Full-time',
    PART_TIME: 'Part-time',
    CONTRACT: 'Contract',
    INTERNSHIP: 'Internship',
    RESEARCH: 'Co-op',
    VOLUNTEER: 'Volunteer',
  };
  return map[type];
}

function getAppStatusBadge(status: AppStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    case 'REVIEWING':
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    case 'ACCEPTED':
      return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
    case 'REJECTED':
      return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
  }
}

function formatSalary(min?: number, max?: number): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

function deadlineLabel(deadline?: string): { text: string; urgent: boolean } | null {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (isPast(d)) return { text: 'Deadline passed', urgent: true };
  const dist = formatDistanceToNow(d, { addSuffix: true });
  const daysLeft = Math.ceil((d.getTime() - Date.now()) / 86400000);
  return { text: `Closes ${dist}`, urgent: daysLeft <= 3 };
}

function buildQueryString(filters: JobFilters): string {
  const params: string[] = [];
  if (filters.type && filters.type !== 'ALL') params.push(`type=${filters.type}`);
  if (filters.remote) params.push('remote=true');
  return params.length ? `?${params.join('&')}` : '';
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function JobCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 animate-pulse space-y-3">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="h-5 w-14 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
    </div>
  );
}

// ─── Apply Modal ──────────────────────────────────────────────────────────────

function ApplyModal({
  job,
  onClose,
  onApply,
  isPending,
}: {
  job: Job;
  onClose: () => void;
  onApply: (coverLetter: string) => void;
  isPending: boolean;
}) {
  const [coverLetter, setCoverLetter] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Apply for Position</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {job.title} at {job.company}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Cover Letter{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={6}
              placeholder="Tell them why you're a great fit..."
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30 focus:border-[#8B0000] resize-none transition-colors"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onApply(coverLetter)}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-[#8B0000] hover:bg-[#6b0000] text-white text-sm font-medium disabled:opacity-60 transition-colors"
            >
              {isPending ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Job Modal ─────────────────────────────────────────────────────────

interface CreateJobForm {
  title: string;
  company: string;
  type: JobType;
  location: string;
  isRemote: boolean;
  description: string;
  requirements: string[];
  deadline: string;
}

const EMPTY_CREATE_FORM: CreateJobForm = {
  title: '',
  company: '',
  type: 'FULL_TIME',
  location: '',
  isRemote: false,
  description: '',
  requirements: [],
  deadline: '',
};

function CreateJobModal({
  onClose,
  onCreate,
  isPending,
}: {
  onClose: () => void;
  onCreate: (data: CreateJobForm) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<CreateJobForm>(EMPTY_CREATE_FORM);
  const [reqInput, setReqInput] = useState('');

  const set = <K extends keyof CreateJobForm>(key: K, value: CreateJobForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addRequirement = () => {
    const trimmed = reqInput.trim();
    if (trimmed && !form.requirements.includes(trimmed)) {
      set('requirements', [...form.requirements, trimmed]);
      setReqInput('');
    }
  };

  const removeRequirement = (req: string) =>
    set('requirements', form.requirements.filter((r) => r !== req));

  const handleReqKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRequirement();
    }
  };

  const isValid = form.title.trim() && form.company.trim() && form.description.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Post a Job</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Job Title <span className="text-[#8B0000]">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Software Engineer Intern"
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30 focus:border-[#8B0000] transition-colors"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Company <span className="text-[#8B0000]">*</span>
            </label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => set('company', e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30 focus:border-[#8B0000] transition-colors"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Job Type
            </label>
            <select
              value={form.type}
              onChange={(e) => set('type', e.target.value as JobType)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30 focus:border-[#8B0000] transition-colors"
            >
              <option value="FULL_TIME">Full-time</option>
              <option value="PART_TIME">Part-time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="RESEARCH">Co-op</option>
              <option value="VOLUNTEER">Volunteer</option>
            </select>
          </div>

          {/* Location + Remote */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder="Boston, MA"
                disabled={form.isRemote}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30 focus:border-[#8B0000] disabled:opacity-50 transition-colors"
              />
            </div>
            <div className="shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Remote
              </label>
              <button
                type="button"
                onClick={() => set('isRemote', !form.isRemote)}
                className={[
                  'relative inline-flex h-[38px] w-16 items-center rounded-xl border transition-colors',
                  form.isRemote
                    ? 'bg-[#8B0000] border-[#8B0000]'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-block w-5 h-5 transform rounded-lg bg-white shadow transition-transform mx-1',
                    form.isRemote ? 'translate-x-7' : 'translate-x-0',
                  ].join(' ')}
                />
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description <span className="text-[#8B0000]">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={4}
              placeholder="Describe the role, responsibilities, and team..."
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30 focus:border-[#8B0000] resize-none transition-colors"
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Requirements
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={reqInput}
                onChange={(e) => setReqInput(e.target.value)}
                onKeyDown={handleReqKeyDown}
                placeholder="Add a requirement and press Enter"
                className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30 focus:border-[#8B0000] transition-colors"
              />
              <button
                type="button"
                onClick={addRequirement}
                className="px-3 py-2 rounded-xl bg-[#8B0000] text-white hover:bg-[#6b0000] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {form.requirements.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.requirements.map((req) => (
                  <span
                    key={req}
                    className="flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full"
                  >
                    {req}
                    <button
                      type="button"
                      onClick={() => removeRequirement(req)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Application Deadline
            </label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => set('deadline', e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30 focus:border-[#8B0000] transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => isValid && onCreate(form)}
              disabled={!isValid || isPending}
              className="flex-1 py-2.5 rounded-xl bg-[#8B0000] hover:bg-[#6b0000] text-white text-sm font-medium disabled:opacity-60 transition-colors"
            >
              {isPending ? 'Posting...' : 'Post Job'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({
  job,
  onClick,
}: {
  job: Job;
  onClick: () => void;
}) {
  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const dl = deadlineLabel(job.deadline);
  const visibleTags = job.tags.slice(0, 3);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-[#8B0000]/40 hover:shadow-sm transition-all p-5 space-y-3"
    >
      {/* Company + Title */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 text-gray-500">
          <Briefcase className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{job.title}</p>
          <p className="text-xs text-gray-500 truncate">{job.company}</p>
        </div>
        {job.hasApplied && job.applicationStatus && (
          <span
            className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${getAppStatusBadge(job.applicationStatus)}`}
          >
            {job.applicationStatus.charAt(0) + job.applicationStatus.slice(1).toLowerCase()}
          </span>
        )}
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-1.5">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTypeBadge(job.type)}`}>
          {getTypeLabel(job.type)}
        </span>
        {job.isRemote && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
            Remote
          </span>
        )}
        {salary && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
            {salary}
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
        {job.location && !job.isRemote && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {job.location}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {job._count.applications} applicant{job._count.applications !== 1 ? 's' : ''}
        </span>
        {dl && (
          <span className={`flex items-center gap-1 ${dl.urgent ? 'text-red-500' : ''}`}>
            <CalendarDays className="w-3 h-3" />
            {dl.text}
          </span>
        )}
      </div>

      {/* Tags */}
      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
          {job.tags.length > 3 && (
            <span className="text-xs text-gray-400 px-1 py-0.5">+{job.tags.length - 3} more</span>
          )}
        </div>
      )}

      {/* Poster */}
      <p className="text-xs text-gray-400">
        Posted by {job.poster.profile?.name ?? job.poster.username}
      </p>
    </button>
  );
}

// ─── Job Detail View ──────────────────────────────────────────────────────────

function JobDetail({
  job,
  onBack,
  onApply,
  applyPending,
}: {
  job: Job;
  onBack: () => void;
  onApply: (coverLetter: string) => void;
  applyPending: boolean;
}) {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const dl = deadlineLabel(job.deadline);

  const handleApply = (coverLetter: string) => {
    onApply(coverLetter);
    setShowApplyModal(false);
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Back button + header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Jobs
          </button>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
              <Briefcase className="w-7 h-7 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
              <p className="text-gray-500 mt-0.5">{job.company}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${getTypeBadge(job.type)}`}
                >
                  {getTypeLabel(job.type)}
                </span>
                {job.isRemote && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                    Remote
                  </span>
                )}
                {salary && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                    {salary}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="px-5 py-4 flex flex-wrap gap-4 text-sm text-gray-500 border-b border-gray-100 dark:border-gray-800">
          {job.location && !job.isRemote && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {job.location}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {job._count.applications} applicant{job._count.applications !== 1 ? 's' : ''}
          </span>
          {dl && (
            <span className={`flex items-center gap-1.5 ${dl.urgent ? 'text-red-500' : ''}`}>
              <CalendarDays className="w-4 h-4" />
              {dl.text}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
          </span>
        </div>

        {/* Description */}
        <div className="p-5 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
              {job.description}
            </p>
          </div>

          {job.requirements.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Requirements
              </h2>
              <ul className="space-y-1.5">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B0000] mt-2 shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.tags.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Apply footer */}
        <div className="p-5 border-t border-gray-100 dark:border-gray-800">
          {job.hasApplied ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 py-2.5 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Applied</span>
              </div>
              {job.applicationStatus && (
                <span
                  className={`text-xs px-3 py-2 rounded-xl font-medium ${getAppStatusBadge(job.applicationStatus)}`}
                >
                  {job.applicationStatus.charAt(0) +
                    job.applicationStatus.slice(1).toLowerCase()}
                </span>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowApplyModal(true)}
              disabled={applyPending}
              className="w-full py-3 rounded-xl bg-[#8B0000] hover:bg-[#6b0000] text-white font-semibold text-sm disabled:opacity-60 transition-colors"
            >
              Apply Now
            </button>
          )}
        </div>
      </div>

      {showApplyModal && (
        <ApplyModal
          job={job}
          onClose={() => setShowApplyModal(false)}
          onApply={handleApply}
          isPending={applyPending}
        />
      )}
    </>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

type FilterTab = { label: string; value: string };

const TYPE_TABS: FilterTab[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Internship', value: 'INTERNSHIP' },
  { label: 'Co-op', value: 'RESEARCH' },
  { label: 'Full-time', value: 'FULL_TIME' },
  { label: 'Part-time', value: 'PART_TIME' },
  { label: 'Remote', value: '__REMOTE__' },
];

function FilterBar({
  filters,
  onChange,
}: {
  filters: JobFilters;
  onChange: (f: JobFilters) => void;
}) {
  const activeTab =
    filters.remote ? '__REMOTE__' : (filters.type || 'ALL');

  const handleTab = (value: string) => {
    if (value === '__REMOTE__') {
      onChange({ ...filters, remote: true, type: 'ALL' });
    } else {
      onChange({ ...filters, remote: false, type: value });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTab(tab.value)}
            className={[
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === tab.value
                ? 'bg-[#8B0000] text-white'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-[#8B0000]/50',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="Search jobs..."
          className="w-full pl-4 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30 focus:border-[#8B0000] transition-colors"
        />
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center col-span-2">
      <Briefcase className="w-14 h-14 text-gray-300 dark:text-gray-600 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No jobs posted yet</h3>
      <p className="text-sm text-gray-500 mt-1">Be the first to post an opportunity!</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<JobFilters>({ type: 'ALL', remote: false, query: '' });
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const queryString = buildQueryString(filters);

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['jobs', queryString],
    queryFn: () => api.get(`/jobs${queryString}`).then((r) => r.data),
  });

  const filteredJobs = filters.query.trim()
    ? jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(filters.query.toLowerCase()) ||
          j.company.toLowerCase().includes(filters.query.toLowerCase()) ||
          j.tags.some((t) => t.toLowerCase().includes(filters.query.toLowerCase())),
      )
    : jobs;

  const selectedJob = filteredJobs.find((j) => j.id === selectedJobId) ?? null;

  const applyMutation = useMutation({
    mutationFn: ({ id, coverLetter }: { id: string; coverLetter: string }) =>
      api.post(`/jobs/${id}/apply`, { coverLetter }),
    onSuccess: (_, { id }) => {
      queryClient.setQueryData<Job[]>(['jobs', queryString], (old = []) =>
        old.map((j) =>
          j.id === id
            ? { ...j, hasApplied: true, applicationStatus: 'PENDING' as AppStatus }
            : j,
        ),
      );
      toast.success('Application submitted!');
    },
    onError: () => toast.error('Failed to submit application'),
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post('/jobs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setShowCreateModal(false);
      toast.success('Job posted successfully!');
    },
    onError: () => toast.error('Failed to post job'),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      {!selectedJob && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jobs</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {filteredJobs.length} opportunit{filteredJobs.length !== 1 ? 'ies' : 'y'} available
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#8B0000] hover:bg-[#6b0000] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Post a Job
          </button>
        </div>
      )}

      {/* Detail view */}
      {selectedJob ? (
        <JobDetail
          job={selectedJob}
          onBack={() => setSelectedJobId(null)}
          onApply={(coverLetter) =>
            applyMutation.mutate({ id: selectedJob.id, coverLetter })
          }
          applyPending={applyMutation.isPending}
        />
      ) : (
        <>
          {/* Filters */}
          <div className="mb-6">
            <FilterBar filters={filters} onChange={setFilters} />
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EmptyState />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onClick={() => setSelectedJobId(job.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <CreateJobModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
        />
      )}
    </div>
  );
}
