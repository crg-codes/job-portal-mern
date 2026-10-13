// Job recommendation scoring (pure functions - no DB access).
import { canonicalCity, locationVariants } from './jobFilters.js';

const LEVELS = ['ENTRY', 'MID', 'SENIOR', 'EXECUTIVE', 'DIRECTOR'];

const SYNONYMS = { js: 'javascript', ts: 'typescript', golang: 'go', postgres: 'postgresql', k8s: 'kubernetes', mongo: 'mongodb', py: 'python' };

// "React.js" / "ReactJS" / "react js" -> "react"
export const normSkill = (s = '') => {
  let v = String(s).toLowerCase().replace(/[\s.\-_]/g, '');
  if (v.length > 4 && v.endsWith('js')) v = v.slice(0, -2);
  return SYNONYMS[v] || v;
};

const STOP = new Set(['senior', 'junior', 'lead', 'the', 'and', 'for', 'with', 'of', 'a', 'an', 'in', 'at', 'to', 'i', 'ii', 'iii']);
const tokens = (text = '') =>
  String(text).toLowerCase().split(/[^a-z0-9+#]+/).filter((t) => t.length > 1 && !STOP.has(t));

// Years of work experience from profile.experience[]
export const totalExperienceYears = (experience = []) => {
  let months = 0;
  for (const e of experience) {
    if (!e.from) continue;
    const from = new Date(e.from);
    const to = e.current || !e.to ? new Date() : new Date(e.to);
    months += Math.max(0, (to - from) / (1000 * 60 * 60 * 24 * 30.4));
  }
  return months / 12;
};

export const levelFromYears = (years) => (years < 2.5 ? 'ENTRY' : years < 6 ? 'MID' : years < 10 ? 'SENIOR' : 'EXECUTIVE');

const locationMatches = (jobLocation = '', wanted = []) => {
  const jl = jobLocation.toLowerCase();
  if (!jl) return false;
  return wanted.some((w) => locationVariants(canonicalCity(w) || w).some((v) => jl.includes(v)));
};

/**
 * @param job      plain job object
 * @param ctx      { profile, appliedJobs: [plain jobs the user applied to] }
 * @returns {score 0-100, reasons: string[]}
 */
export const scoreJob = (job, { profile, appliedJobs = [] }) => {
  const reasons = [];
  let score = 0;

  const prefs = profile?.preferences || {};
  const userSkills = (profile?.skills || []).map(normSkill).filter(Boolean);
  const userSkillSet = new Set(userSkills);
  const jobSkills = (job.skills || []).map((s) => ({ raw: s, key: normSkill(s) })).filter((s) => s.key);

  // 1) Skills (40)
  if (jobSkills.length && userSkillSet.size) {
    const matched = jobSkills.filter((s) => userSkillSet.has(s.key));
    if (matched.length) {
      score += Math.round((matched.length / jobSkills.length) * 40);
      reasons.push(`Matches your skills: ${matched.slice(0, 4).map((s) => s.raw).join(', ')}`);
    }
  } else if (userSkillSet.size) {
    // job lists no skills: look for the user's skills inside title/description
    const text = `${job.title} ${job.description || ''}`.toLowerCase();
    const hit = (profile.skills || []).filter((s) => text.includes(String(s).toLowerCase()));
    if (hit.length) {
      score += Math.min(25, hit.length * 8);
      reasons.push(`Mentions ${hit.slice(0, 3).join(', ')}`);
    }
  }

  // 2) Title vs headline / past roles (10)
  const roleTokens = new Set([
    ...tokens(profile?.headline),
    ...(profile?.experience || []).flatMap((e) => tokens(e.title)),
  ]);
  if (roleTokens.size) {
    const common = tokens(job.title).filter((t) => roleTokens.has(t));
    if (common.length) {
      score += Math.min(10, common.length * 5);
      reasons.push('Similar to your role/experience');
    }
  }

  // 3) Past applications: what kind of jobs the user already applied to (10)
  if (appliedJobs.length) {
    const interest = new Map();
    const interestTitle = new Set();
    for (const a of appliedJobs) {
      (a.skills || []).map(normSkill).forEach((k) => interest.set(k, (interest.get(k) || 0) + 1));
      tokens(a.title).forEach((t) => interestTitle.add(t));
    }
    const sharedSkills = jobSkills.filter((s) => interest.has(s.key));
    const sharedTitle = tokens(job.title).filter((t) => interestTitle.has(t));
    if (sharedSkills.length || sharedTitle.length) {
      score += Math.min(10, sharedSkills.length * 3 + sharedTitle.length * 3);
      reasons.push('Similar to jobs you applied for');
    }
  }

  // 4) Location (15)
  const wantedLocations = [...(prefs.locations || []), profile?.location].filter(Boolean);
  if (wantedLocations.length && locationMatches(job.location, wantedLocations)) {
    score += 15;
    reasons.push(`Located in ${canonicalCity(job.location) || job.location}`);
  } else if (job.remoteType === 'REMOTE' && wantedLocations.length) {
    score += 8;
    reasons.push('Remote friendly');
  }

  // 5) Job type (5)
  if ((prefs.jobTypes || []).includes(job.employmentType)) {
    score += 5;
    reasons.push('Preferred job type');
  }

  // 6) Experience level (10)
  const years = totalExperienceYears(profile?.experience);
  const wantedLevel = prefs.experienceLevel || (profile?.experience?.length ? levelFromYears(years) : null);
  if (wantedLevel && job.experienceLevel) {
    const diff = Math.abs(LEVELS.indexOf(wantedLevel) - LEVELS.indexOf(job.experienceLevel));
    if (diff === 0) {
      score += 10;
      reasons.push('Fits your experience level');
    } else if (diff === 1) {
      score += 4;
    }
  }

  // 7) Work mode (5)
  if (prefs.remotePreference && prefs.remotePreference === job.remoteType) {
    score += 5;
    reasons.push(`${job.remoteType.charAt(0) + job.remoteType.slice(1).toLowerCase()} as you prefer`);
  }

  // 8) Salary (5)
  if (prefs.salaryMin && (job.salaryMax || job.salaryMin) && (job.salaryMax || job.salaryMin) >= prefs.salaryMin) {
    score += 5;
    reasons.push('Meets your salary expectation');
  }

  return { score: Math.min(100, Math.round(score)), reasons };
};

export const profileTips = (profile) => {
  const tips = [];
  if (!profile?.skills?.length) tips.push('Add your skills');
  if (!profile?.preferences?.locations?.length && !profile?.location) tips.push('Add your preferred locations');
  if (!profile?.preferences?.jobTypes?.length) tips.push('Choose preferred job types');
  if (!profile?.experience?.length) tips.push('Add your work experience');
  return tips;
};
