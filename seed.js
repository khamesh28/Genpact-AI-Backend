require('dotenv').config();
const mongoose = require('mongoose');
const Activity = require('./models/Activity');
const Announcement = require('./models/Announcement');
const Project = require('./models/Project');
const Team = require('./models/Team');
const TeamMember = require('./models/TeamMember');
const User = require('./models/User');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─── Seed data ────────────────────────────────────────────────────────────────
const MEETINGS = [
  { title: 'Sprint Planning', duration: 60, summary: 'Planned sprint 14 tasks, story points allocated across team' },
  { title: 'Daily Standup', duration: 15, summary: 'Quick sync on blockers and progress' },
  { title: 'Client Sync – Genpact PMO', duration: 45, summary: 'Reviewed Q2 deliverables and timeline with stakeholders' },
  { title: 'Architecture Review', duration: 90, summary: 'Reviewed microservices migration plan for Phase 2' },
  { title: 'Backlog Grooming', duration: 30, summary: 'Prioritised 12 backlog items, moved 5 to next sprint' },
  { title: 'Team Retrospective', duration: 45, summary: 'Discussed velocity improvements and process gaps' },
  { title: '1:1 with Manager', duration: 30, summary: 'Career development and project feedback' },
  { title: 'Tech Debt Review', duration: 60, summary: 'Identified top 5 tech debt items to address this quarter' },
  { title: 'Cloud Cost Review', duration: 30, summary: 'Azure cost anomaly analysis – savings identified in dev env' },
  { title: 'AI Feature Demo', duration: 45, summary: 'Demoed AI assistant MVP to leadership' },
];

const TASKS = [
  { title: 'Implement JWT refresh token rotation', timeSpent: 120, status: 'completed', priority: 'high', category: 'development' },
  { title: 'Fix pagination bug in admin dashboard', timeSpent: 90, status: 'completed', priority: 'medium', category: 'bug-fix' },
  { title: 'Write API documentation for v2 endpoints', timeSpent: 60, status: 'completed', priority: 'low', category: 'documentation' },
  { title: 'Code review – Sprint board PR #47', timeSpent: 45, status: 'completed', priority: 'medium', category: 'review' },
  { title: 'Set up CI/CD pipeline for staging env', timeSpent: 150, status: 'in-progress', priority: 'high', category: 'development' },
  { title: 'Migrate user sessions to Redis', timeSpent: 120, status: 'completed', priority: 'high', category: 'development' },
  { title: 'Unit tests for activity service', timeSpent: 90, status: 'completed', priority: 'medium', category: 'testing' },
  { title: 'Update ESLint config to strict mode', timeSpent: 30, status: 'completed', priority: 'low', category: 'other' },
  { title: 'Research OpenAI embeddings for search', timeSpent: 75, status: 'completed', priority: 'medium', category: 'development' },
  { title: 'Fix mobile layout on project catalog', timeSpent: 60, status: 'completed', priority: 'medium', category: 'bug-fix' },
  { title: 'Performance profiling – dashboard load time', timeSpent: 90, status: 'completed', priority: 'high', category: 'development' },
  { title: 'Integrate Azure Cost Management API', timeSpent: 180, status: 'in-progress', priority: 'high', category: 'development' },
  { title: 'Refactor TeamContext provider', timeSpent: 60, status: 'completed', priority: 'medium', category: 'development' },
  { title: 'Add rate limiting to auth endpoints', timeSpent: 45, status: 'completed', priority: 'high', category: 'development' },
  { title: 'Sprint 14 demo preparation', timeSpent: 30, status: 'completed', priority: 'medium', category: 'other' },
];

const EXTRAS = [
  { title: 'Completed Azure Fundamentals module', duration: 60, type: 'learning' },
  { title: 'Genpact L&D: Agile Practitioner course', duration: 45, type: 'training' },
  { title: 'Reviewed OWASP Top 10 security guidelines', duration: 30, type: 'learning' },
  { title: 'Team knowledge sharing session', duration: 45, type: 'training' },
  { title: 'Read: "Clean Architecture" chapter 5-6', duration: 30, type: 'learning' },
];

// Per-day plan: [numMeetings, numTasks, numExtras, mood, productivity]
const DAY_PLAN = [
  // 14 days ago → today (index 0 = 14 days ago)
  [2, 3, 1, 'good',      8],
  [1, 4, 0, 'excellent', 9],
  [3, 2, 0, 'neutral',   7],
  [1, 3, 1, 'good',      8],
  [2, 2, 0, 'tired',     6],
  [0, 0, 0, 'neutral',   5], // weekend - skip
  [0, 0, 0, 'neutral',   5], // weekend - skip
  [3, 3, 1, 'good',      8],
  [1, 4, 0, 'excellent', 9],
  [2, 2, 1, 'good',      7],
  [1, 3, 0, 'neutral',   6],
  [2, 3, 1, 'good',      8],
  [0, 0, 0, 'neutral',   5], // weekend - skip
  [0, 0, 0, 'neutral',   5], // weekend - skip
];

// ─── Projects ────────────────────────────────────────────────────────────────
const PROJECT_SEEDS = [
  { name: 'AI Hub Platform', description: 'Internal productivity portal with AI-powered insights and team collaboration', color: '#6366F1', type: 'sprint', status: 'active' },
  { name: 'Azure Cloud Migration', description: 'Migrating on-prem workloads to Azure – Phase 2', color: '#0EA5E9', type: 'kanban', status: 'active' },
  { name: 'Client Reporting Automation', description: 'Automating weekly status reports using Power BI and Azure Data Factory', color: '#10B981', type: 'sprint', status: 'active' },
  { name: 'Security Compliance Audit', description: 'Q2 SOC2 compliance review and gap remediation', color: '#F59E0B', type: 'kanban', status: 'on-hold' },
  { name: 'Mobile App MVP', description: 'React Native companion app for AI Hub field teams', color: '#EC4899', type: 'sprint', status: 'planning' },
];

// ─── Announcements ───────────────────────────────────────────────────────────
const ANNOUNCEMENT_SEEDS = [
  {
    title: 'Sprint 14 Kickoff – May 12',
    content: 'Sprint 14 starts this Monday. All team members please ensure your backlog items are estimated and moved to the sprint board before EOD Friday.\n\nCapacity: 34 story points. Focus areas: AI Hub v1.2, Azure migration Phase 2.',
    priority: 'high',
    isPinned: true,
  },
  {
    title: 'Azure Cost Savings Initiative',
    content: 'We\'ve identified ~$2,400/month in potential savings by rightsizing dev/test VMs. Engineering leads please review the Cloud & Cost dashboard and flag any services that can be scaled down outside business hours.',
    priority: 'medium',
    isPinned: false,
  },
  {
    title: 'New Joiners – Welcome to the Team!',
    content: 'Please join me in welcoming our two new team members who joined this week. They\'ll be ramping up on the AI Hub codebase this sprint. Be sure to say hello in the Collaboration channel!',
    priority: 'low',
    isPinned: false,
  },
  {
    title: 'Q2 Performance Reviews – Due May 30',
    content: 'Self-assessments for Q2 are due by May 30. Please log into Workday and complete your review. Your manager will schedule 1:1s the following week.\n\nReminder: export your activity logs from AI Hub as supporting evidence.',
    priority: 'high',
    isPinned: false,
  },
  {
    title: 'Team Offsite – June 4-5',
    content: 'We have a 2-day team offsite planned at the Marriott Whitefield. Agenda includes product roadmap planning, team building, and a dinner on Day 1. Please mark your calendars and confirm attendance by May 22.',
    priority: 'medium',
    isPinned: false,
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
const seed = async () => {
  await connectDB();

  // Find the user and team
  const user = await User.findOne({}).sort({ createdAt: 1 });
  if (!user) { console.error('No users found. Register first.'); process.exit(1); }

  const membership = await TeamMember.findOne({ user: user._id }).populate('team');
  if (!membership) { console.error('User has no team membership. Create/join a team first.'); process.exit(1); }

  const team = membership.team;
  console.log(`Seeding for user: ${user.name} (${user.email})`);
  console.log(`Team: ${team.name} (${team._id})`);

  // ── Activities ──────────────────────────────────────────────────────────────
  console.log('\nSeeding activities...');
  let meetIdx = 0, taskIdx = 0, extraIdx = 0;
  let activitiesCreated = 0;

  for (let i = DAY_PLAN.length - 1; i >= 0; i--) {
    const [numM, numT, numE, mood, productivity] = DAY_PLAN[i];
    if (numM === 0 && numT === 0 && numE === 0) continue; // skip weekends

    const date = daysAgo(i);

    // Skip if activity already exists for this date
    const exists = await Activity.findOne({ user: user._id, date: { $gte: date, $lt: new Date(date.getTime() + 86400000) } });
    if (exists) { console.log(`  Skipping ${date.toDateString()} – already exists`); continue; }

    const meetings = [];
    for (let m = 0; m < numM; m++) {
      meetings.push({ ...MEETINGS[meetIdx % MEETINGS.length] });
      meetIdx++;
    }

    const tasks = [];
    for (let t = 0; t < numT; t++) {
      tasks.push({ ...TASKS[taskIdx % TASKS.length] });
      taskIdx++;
    }

    const extras = [];
    for (let e = 0; e < numE; e++) {
      extras.push({ ...EXTRAS[extraIdx % EXTRAS.length] });
      extraIdx++;
    }

    await Activity.create({ user: user._id, date, meetings, tasks, extraActivities: extras, mood, productivity });
    activitiesCreated++;
    console.log(`  ✓ ${date.toDateString()} — ${meetings.length} meetings, ${tasks.length} tasks, prod ${productivity}/10`);
  }
  console.log(`Activities: ${activitiesCreated} created`);

  // ── Projects ────────────────────────────────────────────────────────────────
  console.log('\nSeeding projects...');
  let projectsCreated = 0;
  for (const p of PROJECT_SEEDS) {
    const exists = await Project.findOne({ team: team._id, name: p.name });
    if (exists) { console.log(`  Skipping "${p.name}" – exists`); continue; }
    await Project.create({ ...p, team: team._id, createdBy: user._id, teamLead: user._id });
    projectsCreated++;
    console.log(`  ✓ ${p.name}`);
  }
  console.log(`Projects: ${projectsCreated} created`);

  // ── Announcements ───────────────────────────────────────────────────────────
  console.log('\nSeeding announcements...');
  let annCreated = 0;
  for (const a of ANNOUNCEMENT_SEEDS) {
    const exists = await Announcement.findOne({ team: team._id, title: a.title });
    if (exists) { console.log(`  Skipping "${a.title}" – exists`); continue; }
    await Announcement.create({ ...a, team: team._id, createdBy: user._id });
    annCreated++;
    console.log(`  ✓ ${a.title}`);
  }
  console.log(`Announcements: ${annCreated} created`);

  console.log('\n✅ Seed complete!');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
