const Anthropic = require('@anthropic-ai/sdk');
const Activity = require('../models/Activity');
const Project = require('../models/Project');
const Tasks = require('../models/Tasks');
const TeamMember = require('../models/TeamMember');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Build context from user's real data
const buildContext = async (userId, teamId) => {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const [recentActivities, projects, overdueTasks, teamMembers] = await Promise.all([
    Activity.find({ user: userId, date: { $gte: sevenDaysAgo } })
      .sort({ date: -1 }).limit(7).lean(),
    Project.find({ team: teamId }).select('name type status').limit(10).lean(),
    Tasks.find({ assignedTo: userId, status: { $nin: ['done', 'completed'] }, dueDate: { $lt: today } })
      .select('title status priority dueDate').limit(5).lean(),
    TeamMember.find({ team: teamId }).populate('user', 'name').limit(10).lean(),
  ]);

  const totalHoursThisWeek = recentActivities.reduce((sum, a) => {
    const m = (a.meetings || []).reduce((s, i) => s + (i.duration || 0), 0);
    const t = (a.tasks || []).reduce((s, i) => s + (i.timeSpent || 0), 0);
    const e = (a.extraActivities || []).reduce((s, i) => s + (i.duration || 0), 0);
    return sum + (m + t + e) / 60;
  }, 0);

  const avgProductivity = recentActivities.length
    ? (recentActivities.reduce((s, a) => s + (a.productivity || 0), 0) / recentActivities.length).toFixed(1)
    : 0;

  return `
You are a smart work assistant built into WorkTracker, an internal Genpact productivity portal.
You have access to the user's real work data. Answer questions concisely and helpfully.

TODAY: ${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

USER'S LAST 7 DAYS SUMMARY:
- Total hours logged: ${totalHoursThisWeek.toFixed(1)} hrs
- Days with activity: ${recentActivities.length}/7
- Average productivity: ${avgProductivity}/10
- Daily breakdown:
${recentActivities.map(a => {
  const m = (a.meetings || []).reduce((s, i) => s + (i.duration || 0), 0);
  const t = (a.tasks || []).reduce((s, i) => s + (i.timeSpent || 0), 0);
  const e = (a.extraActivities || []).reduce((s, i) => s + (i.duration || 0), 0);
  return `  • ${new Date(a.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${((m + t + e) / 60).toFixed(1)}h | ${a.meetings.length} meetings, ${a.tasks.length} tasks | mood: ${a.mood} | productivity: ${a.productivity}/10`;
}).join('\n')}

ACTIVE PROJECTS (${projects.length} total):
${projects.map(p => `  • ${p.name} (${p.type})`).join('\n') || '  None'}

OVERDUE TASKS (${overdueTasks.length}):
${overdueTasks.map(t => `  • ${t.title} — ${t.priority} priority`).join('\n') || '  None'}

TEAM SIZE: ${teamMembers.length} members

Keep responses short and actionable. Use bullet points when listing multiple items.
If asked something you don't have data for, say so clearly and suggest where to find it in the portal.
`.trim();
};

// POST /api/teams/:teamId/ai-chat
const aiChat = async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
      return res.status(503).json({
        success: false,
        message: 'AI assistant is not configured. Add ANTHROPIC_API_KEY to your backend .env file.',
      });
    }

    const { messages } = req.body;
    if (!messages?.length) {
      return res.status(400).json({ success: false, message: 'Messages are required' });
    }

    const systemPrompt = await buildContext(req.user._id, req.params.teamId);

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    res.json({
      success: true,
      data: { content: response.content[0].text },
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ success: false, message: 'AI assistant encountered an error' });
  }
};

module.exports = { aiChat };
