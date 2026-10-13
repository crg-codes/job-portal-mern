const SYMBOL = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const PERIOD = { YEARLY: 'year', MONTHLY: 'month', WEEKLY: 'week', HOURLY: 'hour' };

const num = (n) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });

export const formatSalary = (job) => {
  const { salaryMin: min, salaryMax: max, salaryCurrency: cur = 'INR', salaryPeriod: period = 'YEARLY' } = job || {};
  if (!min && !max) return null;
  const sym = SYMBOL[cur] || `${cur} `;

  // Indian style for yearly salaries: ₹6 - 12 LPA
  if (cur === 'INR' && period === 'YEARLY' && (min || max) >= 100000) {
    const l = (v) => +(v / 100000).toFixed(2);
    if (min && max) return `${sym}${l(min)} - ${l(max)} LPA`;
    return `${sym}${l(min || max)} LPA${max && !min ? ' max' : '+'}`;
  }
  const range = min && max ? `${sym}${num(min)} - ${num(max)}` : `${sym}${num(min || max)}${min ? '+' : ' max'}`;
  return `${range} / ${PERIOD[period] || 'year'}`;
};

export const timeAgo = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatDate = (date, opts = { month: 'short', day: 'numeric', year: 'numeric' }) =>
  date ? new Date(date).toLocaleDateString(undefined, opts) : '';

export const toDateInput = (date) => (date ? new Date(date).toISOString().slice(0, 10) : '');
