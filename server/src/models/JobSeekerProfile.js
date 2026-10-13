import mongoose from 'mongoose';

const jobSeekerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    headline: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    bio: {
      type: String,
      maxlength: 2000,
    },
    location: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    socialLinks: {
      linkedin: String,
      github: String,
      twitter: String,
      portfolio: String,
    },
    skills: [
      {
        type: String,
        trim: true,
      }
    ],
    experience: [
      {
        title: { type: String, required: true },
        company: { type: String, required: true },
        location: String,
        from: { type: Date, required: true },
        to: Date,
        current: { type: Boolean, default: false },
        description: String,
      }
    ],
    education: [
      {
        school: { type: String, required: true },
        degree: { type: String, required: true },
        fieldOfStudy: { type: String, required: true },
        from: { type: Date, required: true },
        to: Date,
        current: { type: Boolean, default: false },
        description: String,
      }
    ],
    certifications: [
      {
        name: { type: String, required: true },
        issuingOrganization: String,
        issueDate: Date,
        expirationDate: Date,
        credentialId: String,
        credentialUrl: String,
      }
    ],
    languages: [
      {
        language: String,
        proficiency: {
          type: String,
          enum: ['BASIC', 'CONVERSATIONAL', 'FLUENT', 'NATIVE'],
        }
      }
    ],
    preferences: {
      locations: [String],
      jobTypes: [{
        type: String,
        enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY', 'FREELANCE'],
      }],
      salaryMin: Number,
      experienceLevel: {
        type: String,
        enum: ['ENTRY', 'MID', 'SENIOR', 'EXECUTIVE', 'DIRECTOR'],
      },
      remotePreference: {
        type: String,
        enum: ['ONSITE', 'REMOTE', 'HYBRID'],
      }
    },
    profileCompletionPercentage: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
  }
);

const JobSeekerProfile = mongoose.model('JobSeekerProfile', jobSeekerProfileSchema);

export default JobSeekerProfile;
