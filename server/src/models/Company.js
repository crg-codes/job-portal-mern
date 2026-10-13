import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
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
      maxlength: 3000,
    },
    logo: {
      type: String, // URL to image
    },
    coverImage: {
      type: String,
    },
    website: {
      type: String,
      match: [/^https?:\/\/.+/, 'Please provide a valid URL'],
    },
    industry: {
      type: String,
    },
    companySize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    },
    foundedYear: {
      type: Number,
    },
    location: {
      type: String,
    },
    headquarters: {
      type: String,
    },
    socialLinks: {
      linkedin: String,
      twitter: String,
      facebook: String,
    },
    contactEmail: {
      type: String,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        'Please add a valid email',
      ],
    },
    contactPhone: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create slug from name before saving
companySchema.pre('save', async function () {
  if (!this.slug) {
    const base =
      this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || 'company';
    let slug = base;
    // avoid collisions such as "Acme" and "acme!"
    while (await mongoose.models.Company.exists({ slug, _id: { $ne: this._id } })) {
      slug = `${base}-${Math.random().toString(36).substring(2, 6)}`;
    }
    this.slug = slug;
  }
});

companySchema.index({ createdBy: 1 });

const Company = mongoose.model('Company', companySchema);

export default Company;
