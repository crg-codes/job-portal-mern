import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    requirements: {
      type: String,
    },
    responsibilities: {
      type: String,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    employmentType: {
      type: String,
      required: true,
      enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY', 'FREELANCE'],
    },
    experienceLevel: {
      type: String,
      required: true,
      enum: ['ENTRY', 'MID', 'SENIOR', 'EXECUTIVE', 'DIRECTOR'],
    },
    location: {
      type: String,
    },
    remoteType: {
      type: String,
      required: true,
      enum: ['ONSITE', 'REMOTE', 'HYBRID'],
    },
    salaryMin: {
      type: Number,
    },
    salaryMax: {
      type: Number,
    },
    salaryCurrency: {
      type: String,
      default: 'INR',
    },
    salaryPeriod: {
      type: String,
      enum: ['HOURLY', 'WEEKLY', 'MONTHLY', 'YEARLY'],
      default: 'YEARLY',
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED', 'EXPIRED', 'DELETED'],
      default: 'DRAFT',
    },
    applicationDeadline: {
      type: Date,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create slug from title and short random string before saving
jobSchema.pre('save', function () {
  // Slug is created once and kept stable so shared links never break
  if (!this.slug) {
    const randomStr = Math.random().toString(36).substring(2, 7);
    this.slug = `${this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${randomStr}`;
  }
});

// Indexes for robust search and filtering
jobSchema.index({ title: 'text', description: 'text', skills: 'text' }); // Full-text search
jobSchema.index({ company: 1 });
jobSchema.index({ status: 1, publishedAt: -1 });
jobSchema.index({ salaryMin: 1, salaryMax: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ applicationDeadline: 1 });
jobSchema.index({ employmentType: 1 });
jobSchema.index({ remoteType: 1 });
jobSchema.index({ experienceLevel: 1 });

const Job = mongoose.model('Job', jobSchema);

export default Job;
