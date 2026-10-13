// Pure helpers used by Browse Jobs. No DB access here, so they are easy to test.

export const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY', 'FREELANCE'];
export const EXPERIENCE_LEVELS = ['ENTRY', 'MID', 'SENIOR', 'EXECUTIVE', 'DIRECTOR'];
export const REMOTE_TYPES = ['ONSITE', 'REMOTE', 'HYBRID'];

// Same city, different spellings
const CITY_ALIASES = [
  ['bangalore', 'bengaluru', 'bengalore'],
  ['chennai', 'madras'],
  ['mumbai', 'bombay'],
  ['gurgaon', 'gurugram'],
  ['kolkata', 'calcutta'],
  ['pune', 'poona'],
  ['kochi', 'cochin'],
  ['trivandrum', 'thiruvananthapuram'],
  ['coimbatore', 'kovai'],
  ['delhi', 'new delhi'],
];

export const escapeRegex = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// "Bengaluru, Karnataka" -> "Bangalore"; "Salem, Tamil Nadu" -> "Salem"
export const canonicalCity = (location = '') => {
  const first = String(location).split(',')[0].trim();
  if (!first) return '';
  const lower = first.toLowerCase();
  const group = CITY_ALIASES.find((g) => g.includes(lower));
  const name = group ? group[0] : lower;
  return name.replace(/\b\w/g, (c) => c.toUpperCase());
};

// Returns every spelling that should match for a city the user selected/typed
export const locationVariants = (value = '') => {
  const lower = String(value).trim().toLowerCase();
  if (!lower) return [];
  const group = CITY_ALIASES.find((g) => g.includes(lower));
  return group ? group : [lower];
};

const toList = (value) => {
  if (value === undefined || value === null || value === '') return [];
  const arr = Array.isArray(value) ? value : String(value).split(',');
  return arr.map((v) => String(v).trim()).filter(Boolean);
};

const pickEnum = (value, allowed) => toList(value).map((v) => v.toUpperCase()).filter((v) => allowed.includes(v));

const toNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/**
 * Build the MongoDB filter for GET /jobs/search.
 * Every filter is optional and all of them can be combined (AND).
 * `companyIds` = companies whose NAME matches the keyword (so "Infosys" finds Infosys jobs).
 */
export const buildJobFilter = (query = {}, { companyIds = [], now = new Date() } = {}) => {
  const and = [{ status: 'PUBLISHED' }];

  // Hide jobs whose deadline already passed
  and.push({
    $or: [{ applicationDeadline: null }, { applicationDeadline: { $exists: false } }, { applicationDeadline: { $gte: now } }],
  });

  // Keyword: every word must match somewhere (title / skills / description / ... / company name)
  const keyword = String(query.keyword || query.q || '').trim().slice(0, 100);
  if (keyword) {
    for (const word of keyword.split(/\s+/).slice(0, 6)) {
      const rx = new RegExp(escapeRegex(word), 'i');
      const or = [
        { title: rx },
        { skills: rx },
        { description: rx },
        { requirements: rx },
        { responsibilities: rx },
        { location: rx },
      ];
      if (companyIds.length) or.push({ company: { $in: companyIds } });
      and.push({ $or: or });
    }
  }

  // Location: one or many (comma separated). "Bangalore" also finds "Bengaluru".
  const locations = toList(query.location);
  if (locations.length) {
    const patterns = locations.flatMap(locationVariants).map((v) => new RegExp(escapeRegex(v), 'i'));
    and.push({ $or: patterns.map((rx) => ({ location: rx })) });
  }

  const types = pickEnum(query.employmentType, EMPLOYMENT_TYPES);
  if (types.length) and.push({ employmentType: { $in: types } });

  const levels = pickEnum(query.experienceLevel, EXPERIENCE_LEVELS);
  if (levels.length) and.push({ experienceLevel: { $in: levels } });

  const modes = pickEnum(query.remoteType, REMOTE_TYPES);
  if (modes.length) and.push({ remoteType: { $in: modes } });

  // Salary: job range must overlap the range the user asked for
  const minSalary = toNumber(query.salaryMin);
  const maxSalary = toNumber(query.salaryMax);
  if (minSalary !== null) {
    and.push({
      $or: [{ salaryMax: { $gte: minSalary } }, { salaryMax: null, salaryMin: { $gte: minSalary } }],
    });
  }
  if (maxSalary !== null) {
    and.push({ salaryMin: { $lte: maxSalary } });
  }
  if (minSalary !== null || maxSalary !== null) {
    and.push({ $or: [{ salaryMin: { $gt: 0 } }, { salaryMax: { $gt: 0 } }] });
  }
  if (query.currency && /^[A-Za-z]{3}$/.test(query.currency)) {
    and.push({ salaryCurrency: String(query.currency).toUpperCase() });
  }

  const days = toNumber(query.postedWithin);
  if (days) {
    and.push({ publishedAt: { $gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000) } });
  }

  return { $and: and };
};

export const buildSort = (sortBy) => {
  switch (sortBy) {
    case 'oldest':
      return { publishedAt: 1, _id: 1 };
    case 'salary':
    case 'salary_high':
      return { salaryMax: -1, publishedAt: -1 };
    case 'salary_low':
      return { salaryMin: 1, publishedAt: -1 };
    default:
      return { publishedAt: -1, _id: -1 };
  }
};
