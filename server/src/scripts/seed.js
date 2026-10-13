// Run:  npm run seed          (adds demo data, safe to run again)
//       npm run seed -- --reset   (wipes users/jobs/applications first)
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Company from '../models/Company.js';
import EmployerProfile from '../models/EmployerProfile.js';
import JobSeekerProfile from '../models/JobSeekerProfile.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Resume from '../models/Resume.js';

const reset = process.argv.includes('--reset');

const jobs = [
  ['React Developer', 'Chennai, Tamil Nadu', ['React', 'JavaScript', 'Tailwind CSS'], 'FULL_TIME', 'MID', 'HYBRID', 600000, 1200000],
  ['Frontend Engineer (React)', 'Bangalore, Karnataka', ['React', 'TypeScript', 'Redux'], 'FULL_TIME', 'SENIOR', 'HYBRID', 1800000, 3000000],
  ['MERN Stack Developer', 'Chennai, Tamil Nadu', ['MongoDB', 'Express', 'React', 'Node.js'], 'FULL_TIME', 'MID', 'ONSITE', 700000, 1400000],
  ['Node.js Backend Developer', 'Bengaluru, Karnataka', ['Node.js', 'MongoDB', 'AWS'], 'FULL_TIME', 'MID', 'ONSITE', 1000000, 2000000],
  ['Java Developer', 'Hyderabad, Telangana', ['Java', 'Spring Boot', 'MySQL'], 'FULL_TIME', 'MID', 'ONSITE', 900000, 1800000],
  ['Python Data Analyst', 'Pune, Maharashtra', ['Python', 'SQL', 'Pandas'], 'FULL_TIME', 'ENTRY', 'ONSITE', 400000, 800000],
  ['UI/UX Designer', 'Chennai, Tamil Nadu', ['Figma', 'Prototyping'], 'CONTRACT', 'MID', 'REMOTE', 50000, 90000, 'MONTHLY'],
  ['React Intern', 'Chennai, Tamil Nadu', ['React', 'HTML', 'CSS'], 'INTERNSHIP', 'ENTRY', 'ONSITE', 10000, 20000, 'MONTHLY'],
  ['DevOps Engineer', 'Mumbai, Maharashtra', ['Docker', 'Kubernetes', 'AWS'], 'FULL_TIME', 'SENIOR', 'HYBRID', 2000000, 3500000],
  ['Full Stack Developer (Remote)', 'Remote', ['React', 'Node.js', 'PostgreSQL'], 'FULL_TIME', 'MID', 'REMOTE', 1200000, 2200000],
  ['Part-time React Tutor', 'Coimbatore, Tamil Nadu', ['React', 'Teaching'], 'PART_TIME', 'ENTRY', 'ONSITE', 15000, 25000, 'MONTHLY'],
  ['QA Automation Engineer', 'Bangalore, Karnataka', ['Selenium', 'Java', 'Testing'], 'FULL_TIME', 'MID', 'ONSITE', 800000, 1500000],
  ['Freelance Node.js Developer', 'Remote', ['Node.js', 'Express'], 'FREELANCE', 'MID', 'REMOTE', 800, 1500, 'HOURLY'],
  ['Engineering Manager', 'Hyderabad, Telangana', ['Leadership', 'Agile', 'Java'], 'FULL_TIME', 'DIRECTOR', 'ONSITE', 4000000, 6500000],
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to', mongoose.connection.name);

  if (reset) {
    await Promise.all([User, Company, EmployerProfile, JobSeekerProfile, Job, Application, Resume].map((m) => m.deleteMany({})));
    console.log('Old data removed');
  }

  const ensureUser = async (data) => (await User.findOne({ email: data.email })) || User.create(data);

  const admin = await ensureUser({ firstName: 'Admin', lastName: 'User', email: 'admin@jobportal.test', passwordHash: 'Admin@12345', role: 'ADMIN' });
  const employer = await ensureUser({ firstName: 'Priya', lastName: 'Recruiter', email: 'employer@jobportal.test', passwordHash: 'Employer@12345', role: 'EMPLOYER' });
  const seeker = await ensureUser({ firstName: 'Arun', lastName: 'Kumar', email: 'seeker@jobportal.test', passwordHash: 'Seeker@12345', role: 'JOB_SEEKER' });

  let company = await Company.findOne({ createdBy: employer._id });
  if (!company) {
    company = await Company.create({
      name: 'TechNova Solutions',
      description: 'We build web products for startups across India.',
      industry: 'Software',
      companySize: '51-200',
      location: 'Chennai, Tamil Nadu',
      website: 'https://technova.example.com',
      createdBy: employer._id,
    });
  }
  await EmployerProfile.findOneAndUpdate({ user: employer._id }, { company: company._id, jobTitle: 'HR Manager' }, { upsert: true });

  await JobSeekerProfile.findOneAndUpdate(
    { user: seeker._id },
    {
      headline: 'MERN Stack Developer',
      location: 'Chennai',
      skills: ['React', 'Node.js', 'MongoDB', 'JavaScript'],
      experience: [{ title: 'Frontend Developer', company: 'ABC Soft', from: new Date('2022-06-01'), current: true }],
      preferences: { locations: ['Chennai', 'Bangalore'], jobTypes: ['FULL_TIME'], experienceLevel: 'MID', salaryMin: 600000, remotePreference: 'HYBRID' },
    },
    { upsert: true }
  );

  if (!(await Job.countDocuments({ createdBy: employer._id }))) {
    for (const [title, location, skills, employmentType, experienceLevel, remoteType, salaryMin, salaryMax, salaryPeriod = 'YEARLY'] of jobs) {
      await Job.create({
        title,
        location,
        skills,
        employmentType,
        experienceLevel,
        remoteType,
        salaryMin,
        salaryMax,
        salaryPeriod,
        salaryCurrency: 'INR',
        description: `We are hiring a ${title}. You will work with ${skills.join(', ')} in a friendly team.`,
        requirements: `Good knowledge of ${skills.join(', ')}.`,
        responsibilities: 'Build features, review code, and collaborate with the team.',
        company: company._id,
        createdBy: employer._id,
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - Math.random() * 20 * 24 * 3600 * 1000),
      });
    }
    console.log(`${jobs.length} jobs created`);
  }

  console.log('\nDemo logins');
  console.log('  Admin    : admin@jobportal.test    / Admin@12345');
  console.log('  Employer : employer@jobportal.test / Employer@12345');
  console.log('  Seeker   : seeker@jobportal.test   / Seeker@12345\n');
  await mongoose.disconnect();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
