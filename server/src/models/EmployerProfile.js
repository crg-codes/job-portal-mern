import mongoose from 'mongoose';

const employerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    jobTitle: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    contactDetails: {
      phone: String,
      alternativeEmail: String,
    },
    designation: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

employerProfileSchema.index({ company: 1 });

const EmployerProfile = mongoose.model('EmployerProfile', employerProfileSchema);

export default EmployerProfile;
