const mongoose = require('mongoose');
const crypto = require('crypto');

const projectSchema = new mongoose.Schema(
  {
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title must be at most 100 characters'],
    },
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
      minlength: [2, 'Client name must be at least 2 characters'],
      maxlength: [100, 'Client name must be at most 100 characters'],
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: [0.01, 'Hourly rate must be greater than 0'],
      max: [100000, 'Hourly rate must be at most 100000'],
    },
    // 48-char hex string generated at creation (crypto.randomBytes(24))
    portalToken: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused'],
      default: 'active',
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
    totalHours: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Auto-generate portalToken before validation
projectSchema.pre('validate', function () {
  if (this.isNew && !this.portalToken) {
    this.portalToken = crypto.randomBytes(24).toString('hex');
  }
});

projectSchema.index({ freelancerId: 1 });

module.exports = mongoose.model('Project', projectSchema);
