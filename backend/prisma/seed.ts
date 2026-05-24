import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const password = await bcrypt.hash('Password123!', 12);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'alex@northeastern.edu', username: 'alex_chen', password, verified: true,
        profile: { create: { name: 'Alex Chen', university: 'Northeastern University', major: 'Computer Science', year: '2nd Year', bio: 'CS grad student passionate about AI and distributed systems.', skills: ['Python', 'Machine Learning', 'React', 'Node.js'], languages: ['en', 'zh'], interests: ['AI', 'Gaming', 'Photography', 'Hiking'], hasOnboarded: true } },
      },
    }),
    prisma.user.create({
      data: {
        email: 'priya@bu.edu', username: 'priya_s', password,
        profile: { create: { name: 'Priya Sharma', university: 'Boston University', major: 'Data Science', year: '1st Year', bio: 'Data scientist exploring NLP and real-world AI applications.', skills: ['Python', 'R', 'TensorFlow', 'SQL'], languages: ['en', 'hi'], interests: ['AI', 'Data Visualization', 'Cooking', 'Travel'] } },
      },
    }),
    prisma.user.create({
      data: {
        email: 'marco@mit.edu', username: 'marco_r', password,
        profile: { create: { name: 'Marco Rossi', university: 'MIT', major: 'Electrical Engineering', year: '3rd Year', bio: 'Building the future of robotics and embedded systems.', skills: ['C++', 'ROS', 'MATLAB', 'Python'], languages: ['en', 'it'], interests: ['Robotics', 'Music', 'Gaming', 'Film'] } },
      },
    }),
    prisma.user.create({
      data: {
        email: 'yuki@harvard.edu', username: 'yuki_t', password,
        profile: { create: { name: 'Yuki Tanaka', university: 'Harvard', major: 'Biomedical Engineering', year: '2nd Year', bio: 'Bridging biology and technology for better healthcare.', skills: ['MATLAB', 'Python', 'Lab Research', 'Statistics'], languages: ['en', 'ja'], interests: ['Healthcare', 'AI', 'Tennis', 'Photography'] } },
      },
    }),
    prisma.user.create({
      data: {
        email: 'sofia@tufts.edu', username: 'sofia_l', password,
        profile: { create: { name: 'Sofia Lopez', university: 'Tufts', major: 'Human-Computer Interaction', year: '1st Year', bio: 'Designing inclusive and beautiful digital experiences.', skills: ['Figma', 'React', 'User Research', 'CSS'], languages: ['en', 'es'], interests: ['Design', 'Art', 'Accessibility', 'Coffee'] } },
      },
    }),
  ]);

  // Create communities
  const communities = await Promise.all([
    prisma.community.create({ data: { name: 'AI Research', slug: 'ai-research', description: 'Discuss latest AI research papers, projects and breakthroughs.', memberCount: 1 } }),
    prisma.community.create({ data: { name: 'Campus Coders', slug: 'campus-coders', description: 'A space for student developers to share projects and get help.', memberCount: 1 } }),
    prisma.community.create({ data: { name: 'International Students Hub', slug: 'international-hub', description: 'Supporting international students with tips, resources and community.', memberCount: 1 } }),
  ]);

  // Create posts
  await Promise.all([
    prisma.post.create({ data: { authorId: users[0].id, type: 'TEXT', content: 'Just published my first ML paper on transformer architectures! 🎉 Happy to share the preprint with anyone interested in NLP.', hashtags: ['MachineLearning', 'NLP', 'Research'], visibility: 'PUBLIC', likeCount: 24 } }),
    prisma.post.create({ data: { authorId: users[1].id, type: 'MICRO', content: 'Study tip: Use spaced repetition for complex algorithms. Game changer! 📚 #GradLife #ComputerScience', hashtags: ['GradLife', 'ComputerScience'], visibility: 'PUBLIC', likeCount: 18 } }),
    prisma.post.create({ data: { authorId: users[2].id, type: 'TEXT', content: 'Our robotics team just won 2nd place at the regional competition! So proud of everyone. Check out the video of our robot navigating the obstacle course 🤖', hashtags: ['Robotics', 'Competition', 'MIT'], visibility: 'PUBLIC', likeCount: 45 } }),
    prisma.post.create({ data: { authorId: users[3].id, type: 'BLOG', title: 'AI in Healthcare: Opportunities and Ethical Challenges', content: 'As we integrate AI deeper into clinical workflows, we must address fundamental questions about bias, transparency, and patient autonomy...', hashtags: ['AI', 'Healthcare', 'Ethics'], visibility: 'PUBLIC', likeCount: 67 } }),
  ]);

  // Create jobs
  await prisma.job.create({ data: { posterId: users[0].id, title: 'ML Research Intern', company: 'AI Lab @ Northeastern', description: 'Join our lab to work on NLP and computer vision research. Great opportunity for grad students.', requirements: ['Python', 'PyTorch', 'Research experience'], type: 'INTERNSHIP', isRemote: false, location: 'Boston, MA' } });

  // Create event
  await prisma.event.create({ data: { organizerId: users[0].id, title: 'Boston Tech Networking Night', description: 'Connect with fellow grad students and industry professionals. Free food and drinks!', startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), location: 'Northeastern University, Boston', isVirtual: false, status: 'PUBLISHED' } });

  // Create marketplace listing
  await prisma.product.create({ data: { sellerId: users[0].id, title: 'Calculus Textbook (Stewart, 8th Ed)', description: 'Perfect condition, barely used. Great for MATH courses.', price: 45, category: 'Books', condition: 'LIKE_NEW', images: [] } });

  // More jobs
  await Promise.all([
    (prisma as any).job.create({ data: { posterId: users[0].id, title: 'Software Engineer Co-op', company: 'HubSpot', description: 'Full-cycle co-op building product features in TypeScript and React. 6-month rotation starting January.', requirements: ['TypeScript', 'React', 'REST APIs'], type: 'INTERNSHIP', isRemote: false, location: 'Cambridge, MA', salaryMin: 35, salaryMax: 45, deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), tags: ['Frontend', 'TypeScript', 'Co-op'] } }),
    (prisma as any).job.create({ data: { posterId: users[1].id, title: 'Data Science Intern', company: 'Wayfair', description: 'Work on demand forecasting and pricing ML models. Python-heavy, great mentorship.', requirements: ['Python', 'SQL', 'Pandas', 'Statistics'], type: 'INTERNSHIP', isRemote: false, location: 'Boston, MA', salaryMin: 32, salaryMax: 40, deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), tags: ['Data Science', 'ML', 'Python'] } }),
    (prisma as any).job.create({ data: { posterId: users[2].id, title: 'Robotics Research Assistant', company: 'MIT CSAIL', description: 'Help build next-gen robotic manipulation systems. Prior ROS experience preferred.', requirements: ['C++', 'ROS', 'Python'], type: 'RESEARCH', isRemote: false, location: 'Cambridge, MA', salaryMin: 20, salaryMax: 25, tags: ['Robotics', 'Research', 'C++'] } }),
    (prisma as any).job.create({ data: { posterId: users[3].id, title: 'UX Design Intern (Remote)', company: 'Figma', description: 'Join the design team crafting the future of collaborative design tools.', requirements: ['Figma', 'User Research', 'Prototyping'], type: 'INTERNSHIP', isRemote: true, salaryMin: 38, salaryMax: 48, deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), tags: ['Design', 'UX', 'Remote'] } }),
  ]);

  // Polls
  await Promise.all([
    (prisma as any).poll.create({ data: { authorId: users[0].id, question: 'What\'s your preferred tech stack for a new project in 2025?', options: [{ text: 'Next.js + tRPC', votes: 45 }, { text: 'Remix + Prisma', votes: 12 }, { text: 'SvelteKit', votes: 28 }, { text: 'Nuxt 3', votes: 8 }], totalVotes: 93, endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) } }),
    (prisma as any).poll.create({ data: { authorId: users[1].id, question: 'How many hours do you actually spend on co-op job applications per week?', options: [{ text: '< 2 hours', votes: 34 }, { text: '2-5 hours', votes: 67 }, { text: '5-10 hours', votes: 41 }, { text: '10+ hours (send help)', votes: 29 }], totalVotes: 171 } }),
    (prisma as any).poll.create({ data: { authorId: users[2].id, question: 'Best CS elective at Northeastern?', options: [{ text: 'Foundations of AI', votes: 88 }, { text: 'Computer Vision', votes: 54 }, { text: 'Distributed Systems', votes: 71 }, { text: 'Compilers', votes: 19 }], totalVotes: 232 } }),
  ]);

  // Q&A questions
  const q1 = await (prisma as any).question.create({ data: { authorId: users[0].id, title: 'How do I handle async operations in useEffect without memory leaks?', content: 'I\'ve been running into issues where fetching data inside useEffect causes "can\'t perform state update on unmounted component" warnings. What\'s the cleanest pattern to handle this?', tags: ['React', 'JavaScript', 'Hooks'], views: 342 } });
  const q2 = await (prisma as any).question.create({ data: { authorId: users[1].id, title: 'Best way to structure a Python ML project for reproducibility?', content: 'Working on a research project and want to make sure experiments are reproducible. How do you structure your MLflow/DVC setup? Any repo templates?', tags: ['Python', 'MLOps', 'Research'], views: 187 } });
  await Promise.all([
    (prisma as any).answer.create({ data: { questionId: q1.id, authorId: users[4].id, content: 'Use an AbortController and a cleanup flag:\n\n```js\nuseEffect(() => {\n  let mounted = true;\n  fetchData().then(data => { if (mounted) setData(data); });\n  return () => { mounted = false; };\n}, []);\n```\nThis is the pattern recommended in the React docs.', votes: 24, isAccepted: true } }),
    (prisma as any).answer.create({ data: { questionId: q1.id, authorId: users[2].id, content: 'React Query / TanStack Query handles all of this for you automatically. Strongly recommend switching to it for data fetching instead of raw useEffect.', votes: 18 } }),
    (prisma as any).answer.create({ data: { questionId: q2.id, authorId: users[0].id, content: 'The Cookiecutter Data Science template is great. Combine with DVC for data versioning and MLflow for experiment tracking. Key is separating data, notebooks, src, and models directories.', votes: 15 } }),
  ]);

  // Achievements
  await Promise.all([
    (prisma as any).achievement.create({ data: { userId: users[0].id, type: 'FIRST_POST', title: 'First Post', description: 'Published your very first post on HuskyMingle', icon: '📝', points: 50 } }),
    (prisma as any).achievement.create({ data: { userId: users[0].id, type: 'SOCIAL_BUTTERFLY', title: 'Social Butterfly', description: 'Followed 10 other Huskies', icon: '🦋', points: 100 } }),
    (prisma as any).achievement.create({ data: { userId: users[0].id, type: 'EVENT_GOER', title: 'Event Explorer', description: 'RSVP\'d to your first campus event', icon: '🎉', points: 75 } }),
    (prisma as any).achievement.create({ data: { userId: users[0].id, type: 'HELPER', title: 'Helpful Husky', description: 'Answered 5 questions in the Q&A', icon: '🤝', points: 150 } }),
  ]);

  // Courses
  await Promise.all([
    (prisma as any).course.create({ data: { instructorId: users[0].id, title: 'Machine Learning Fundamentals', description: 'From linear regression to neural networks. Hands-on Python labs with real datasets. Covers scikit-learn, PyTorch, and model evaluation.', price: 0, lessons: [{ title: 'Linear Regression', duration: 2400 }, { title: 'Classification', duration: 3000 }, { title: 'Neural Networks', duration: 3600 }, { title: 'Model Evaluation', duration: 2100 }], tags: ['AI', 'Python', 'ML'], enrollmentCount: 234, rating: 4.8 } }),
    (prisma as any).course.create({ data: { instructorId: users[4].id, title: 'UI/UX Design with Figma', description: 'Learn design thinking, wireframing, prototyping, and user testing. Build a portfolio-worthy case study from scratch.', price: 0, lessons: [{ title: 'Design Thinking', duration: 1800 }, { title: 'Wireframing', duration: 2700 }, { title: 'Prototyping in Figma', duration: 3300 }, { title: 'User Testing', duration: 2400 }], tags: ['Design', 'Figma', 'UX'], enrollmentCount: 156, rating: 4.9 } }),
    (prisma as any).course.create({ data: { instructorId: users[1].id, title: 'Data Analysis with Python & SQL', description: 'Practical data analysis using pandas, matplotlib, and PostgreSQL. Includes 3 real-world projects.', price: 0, lessons: [{ title: 'Python Basics', duration: 1800 }, { title: 'Pandas DataFrames', duration: 3000 }, { title: 'SQL Queries', duration: 2700 }, { title: 'Data Visualization', duration: 2400 }], tags: ['Python', 'SQL', 'Data'], enrollmentCount: 312, rating: 4.7 } }),
  ]);

  // Audio rooms
  await Promise.all([
    (prisma as any).audioRoom.create({ data: { hostId: users[0].id, title: 'CS Co-op Interview Prep 🎙️', description: 'Practice behavioral and technical questions together. All experience levels welcome.', status: 'LIVE', maxSpeakers: 10, participantCount: 23, tags: ['Career', 'Co-op', 'CS'] } }),
    (prisma as any).audioRoom.create({ data: { hostId: users[1].id, title: 'Data Science Study Group', description: 'Working through ML Specialization together. Join to ask questions or share resources.', status: 'LIVE', maxSpeakers: 5, participantCount: 8, tags: ['Data Science', 'Study'] } }),
    (prisma as any).audioRoom.create({ data: { hostId: users[2].id, title: 'Robotics Club Weekly Standup', status: 'ENDED', maxSpeakers: 20, participantCount: 0, tags: ['Robotics', 'Club'] } }),
  ]);

  // Live streams
  await Promise.all([
    (prisma as any).liveStream.create({ data: { streamerId: users[0].id, title: 'Building a Full-Stack App Live 🚀', description: 'Coding session: building HuskyMingle features in real-time. Ask me anything!', status: 'LIVE', viewerCount: 67, peakViewers: 89 } }),
    (prisma as any).liveStream.create({ data: { streamerId: users[3].id, title: 'AI in Healthcare — Panel Discussion', description: 'Live panel with researchers and clinicians discussing the future of AI-assisted diagnosis.', status: 'SCHEDULED', viewerCount: 0, peakViewers: 0 } }),
    (prisma as any).liveStream.create({ data: { streamerId: users[1].id, title: 'Kaggle Competition Walkthrough', description: 'Solving a time-series forecasting challenge from scratch — model selection, feature engineering, submission.', status: 'ENDED', viewerCount: 0, peakViewers: 142 } }),
  ]);

  // Notifications for alex
  await Promise.all([
    prisma.notification.create({ data: { userId: users[0].id, senderId: users[1].id, type: 'FOLLOW', title: 'Priya Sharma followed you', body: 'priya_s started following you', read: false } }),
    prisma.notification.create({ data: { userId: users[0].id, senderId: users[2].id, type: 'LIKE', title: 'Marco Rossi liked your post', body: 'Your post about ML research got a like', read: false } }),
    prisma.notification.create({ data: { userId: users[0].id, senderId: users[3].id, type: 'COMMENT', title: 'Yuki Tanaka commented on your post', body: '"Great insights on AI ethics! Have you read Floridi\'s work?"', read: true } }),
    prisma.notification.create({ data: { userId: users[0].id, type: 'ACHIEVEMENT', title: 'Achievement Unlocked: Social Butterfly 🦋', body: 'You\'ve followed 10 Huskies and earned 100 points!', read: false } }),
    prisma.notification.create({ data: { userId: users[0].id, senderId: users[4].id, type: 'EVENT_INVITE', title: 'Sofia Lopez invited you to an event', body: 'HCI Research Showcase — Friday at 6pm, Forsyth Building', read: false } }),
    prisma.notification.create({ data: { userId: users[0].id, type: 'JOB_MATCH', title: 'New job match: ML Engineer at Cognex', body: 'Based on your skills in Python and Machine Learning', read: true } }),
  ]);

  console.log('✅ Seed completed!');
  console.log('📧 Login: alex@northeastern.edu / Password123!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
