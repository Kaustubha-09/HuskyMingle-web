'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  Star,
  Users,
  Clock,
  BookOpen,
  ChevronRight,
  ArrowLeft,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Lesson {
  title: string;
  duration: number; // seconds
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  price: number;
  lessons: Lesson[];
  tags: string[];
  enrollmentCount: number;
  rating: number;
  createdAt: string;
  instructor: { username: string; profile?: { name: string; avatar?: string } };
}

interface EnrolledCourse extends Course {
  progress: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const TAG_GRADIENTS: [string, string][] = [
  ['from-blue-600', 'to-cyan-500'],
  ['from-purple-600', 'to-pink-500'],
  ['from-green-600', 'to-teal-500'],
  ['from-orange-600', 'to-amber-500'],
  ['from-rose-600', 'to-red-500'],
  ['from-indigo-600', 'to-violet-500'],
];

function gradientForTags(tags: string[]): [string, string] {
  const key = tags[0] ?? 'default';
  return TAG_GRADIENTS[hashStr(key) % TAG_GRADIENTS.length];
}

function fmtDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function totalDuration(lessons: Lesson[]): number {
  return lessons.reduce((acc, l) => acc + l.duration, 0);
}

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={
            i <= full
              ? 'text-amber-400 fill-amber-400'
              : i === full + 1 && half
              ? 'text-amber-400 fill-amber-200'
              : 'text-gray-300 dark:text-gray-600'
          }
        />
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CourseCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-pulse">
      <div className="h-36 bg-gray-200 dark:bg-gray-700" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      </div>
    </div>
  );
}

function InstructorAvatar({
  name,
  avatar,
}: {
  name: string;
  avatar?: string;
}) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="w-5 h-5 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="w-5 h-5 rounded-full bg-[#8B0000] flex items-center justify-center text-white text-[10px] font-bold">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function CourseCard({
  course,
  enrolled,
  progress,
  onEnroll,
  enrolling,
  onClick,
}: {
  course: Course;
  enrolled: boolean;
  progress?: number;
  onEnroll: (e: React.MouseEvent) => void;
  enrolling: boolean;
  onClick: () => void;
}) {
  const [from, to] = gradientForTags(course.tags);
  const instructorName =
    course.instructor.profile?.name ?? course.instructor.username;

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      {/* Thumbnail */}
      {course.thumbnail ? (
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-36 object-cover"
        />
      ) : (
        <div
          className={`w-full h-36 bg-gradient-to-br ${from} ${to} flex items-center justify-center`}
        >
          <GraduationCap size={36} className="text-white/70" />
        </div>
      )}

      <div className="p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
          {course.title}
        </h3>

        {/* Instructor */}
        <div className="flex items-center gap-1.5">
          <InstructorAvatar
            name={instructorName}
            avatar={course.instructor.profile?.avatar}
          />
          <span className="text-xs text-gray-500">{instructorName}</span>
        </div>

        {/* Rating + enrollment */}
        <div className="flex items-center justify-between">
          <RatingStars rating={course.rating} />
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Users size={11} />
            <span>{course.enrollmentCount}</span>
          </div>
        </div>

        {/* Tags */}
        {course.tags.slice(0, 3).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {course.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <BookOpen size={11} />
              {course.lessons.length} lessons
            </span>
          </div>
          <span className="text-sm font-bold text-[#8B0000]">
            {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
          </span>
        </div>

        {/* Enroll button */}
        <button
          onClick={onEnroll}
          disabled={enrolling}
          className={`w-full py-2 rounded-xl text-sm font-semibold transition-colors mt-1 ${
            enrolled
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-[#8B0000] hover:bg-[#6b0000] text-white disabled:opacity-60'
          }`}
        >
          {enrolled
            ? `Enrolled — ${progress ?? 0}% complete`
            : enrolling
            ? 'Enrolling…'
            : 'Enroll'}
        </button>
      </div>
    </div>
  );
}

function CourseDetail({
  course,
  enrolled,
  progress,
  onEnroll,
  enrolling,
  onBack,
}: {
  course: Course;
  enrolled: boolean;
  progress?: number;
  onEnroll: () => void;
  enrolling: boolean;
  onBack: () => void;
}) {
  const [from, to] = gradientForTags(course.tags);
  const instructorName =
    course.instructor.profile?.name ?? course.instructor.username;

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={16} />
        Back to courses
      </button>

      {/* Hero */}
      {course.thumbnail ? (
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-48 object-cover rounded-2xl"
        />
      ) : (
        <div
          className={`w-full h-48 rounded-2xl bg-gradient-to-br ${from} ${to} flex items-center justify-center`}
        >
          <GraduationCap size={56} className="text-white/70" />
        </div>
      )}

      {/* Title + meta */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {course.title}
        </h2>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <RatingStars rating={course.rating} />
          <span className="flex items-center gap-1">
            <Users size={13} />
            {course.enrollmentCount} enrolled
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <InstructorAvatar
            name={instructorName}
            avatar={course.instructor.profile?.avatar}
          />
          <span className="text-sm text-gray-500">by {instructorName}</span>
        </div>
      </div>

      {/* Price + enroll */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
        <div>
          <p className="text-2xl font-bold text-[#8B0000]">
            {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {course.lessons.length} lessons ·{' '}
            {fmtDuration(totalDuration(course.lessons))} total
          </p>
        </div>
        <button
          onClick={onEnroll}
          disabled={enrolling || enrolled}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            enrolled
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-[#8B0000] hover:bg-[#6b0000] text-white disabled:opacity-60'
          }`}
        >
          {enrolled ? (
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} /> Enrolled
            </span>
          ) : enrolling ? (
            'Enrolling…'
          ) : (
            'Enroll Now'
          )}
        </button>
      </div>

      {/* Description */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          About this course
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {course.description}
        </p>
      </div>

      {/* Tags */}
      {course.tags.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
            <Tag size={14} /> Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {course.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Lessons */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          Curriculum ({course.lessons.length} lessons)
        </h3>
        <div className="space-y-2">
          {course.lessons.map((lesson, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-500 font-medium flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {lesson.title}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={11} />
                {fmtDuration(lesson.duration)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EnrolledCourseRow({ course }: { course: EnrolledCourse }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${gradientForTags(course.tags).join(' ')}`}
        >
          <GraduationCap size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {course.title}
          </p>
          <p className="text-xs text-gray-500">
            {course.instructor.profile?.name ?? course.instructor.username}
          </p>
        </div>
        <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Progress</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {course.progress}%
          </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
          <div
            className="bg-[#8B0000] h-2 rounded-full transition-all"
            style={{ width: `${course.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoursesPage() {
  const [tab, setTab] = useState<'browse' | 'my'>('browse');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const qc = useQueryClient();

  const { data: courses = [], isLoading: loadingCourses } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await api.get('/courses');
      return res.data;
    },
  });

  const { data: enrolled = [] } = useQuery<EnrolledCourse[]>({
    queryKey: ['courses', 'enrolled'],
    queryFn: async () => {
      try {
        const res = await api.get('/courses/enrolled');
        return res.data;
      } catch {
        return [];
      }
    },
  });

  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => api.post(`/courses/${courseId}/enroll`),
    onSuccess: () => {
      toast.success('Enrolled successfully!');
      qc.invalidateQueries({ queryKey: ['courses', 'enrolled'] });
    },
    onError: () => toast.error('Could not enroll — please try again'),
  });

  const enrolledIds = new Set(enrolled.map((e) => e.id));
  const enrolledProgress = new Map(enrolled.map((e) => [e.id, e.progress]));

  const handleEnroll = (courseId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    enrollMutation.mutate(courseId);
  };

  const selectedIsEnrolled = selectedCourse ? enrolledIds.has(selectedCourse.id) : false;
  const selectedProgress = selectedCourse ? enrolledProgress.get(selectedCourse.id) : undefined;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Courses</h1>
      </div>

      {/* Detail view */}
      {selectedCourse && (
        <CourseDetail
          course={selectedCourse}
          enrolled={selectedIsEnrolled}
          progress={selectedProgress}
          onEnroll={() => handleEnroll(selectedCourse.id)}
          enrolling={enrollMutation.isPending && enrollMutation.variables === selectedCourse.id}
          onBack={() => setSelectedCourse(null)}
        />
      )}

      {/* List view */}
      {!selectedCourse && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            {(['browse', 'my'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t
                    ? 'border-[#8B0000] text-[#8B0000]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {t === 'browse' ? 'Browse' : 'My Courses'}
              </button>
            ))}
          </div>

          {/* Browse tab */}
          {tab === 'browse' && (
            <>
              {loadingCourses && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <CourseCardSkeleton key={i} />
                  ))}
                </div>
              )}
              {!loadingCourses && courses.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <GraduationCap size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    No courses yet
                  </h3>
                  <p className="text-gray-500 text-sm">Check back soon for new courses</p>
                </div>
              )}
              {!loadingCourses && courses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      enrolled={enrolledIds.has(course.id)}
                      progress={enrolledProgress.get(course.id)}
                      onEnroll={(e) => handleEnroll(course.id, e)}
                      enrolling={
                        enrollMutation.isPending &&
                        enrollMutation.variables === course.id
                      }
                      onClick={() => setSelectedCourse(course)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* My Courses tab */}
          {tab === 'my' && (
            <>
              {enrolled.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <GraduationCap
                    size={48}
                    className="text-gray-300 dark:text-gray-600 mb-4"
                  />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No courses enrolled yet
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Browse and enroll to start learning
                  </p>
                  <button
                    onClick={() => setTab('browse')}
                    className="bg-[#8B0000] hover:bg-[#6b0000] text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-colors"
                  >
                    Browse Courses
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrolled.map((course) => (
                    <EnrolledCourseRow key={course.id} course={course} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
