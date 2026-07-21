const mongoose = require('mongoose');

const scopeItemSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Scope item title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title must be at most 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    categoryTag: {
      type: String,
      required: [true, 'Category tag is required'],
      trim: true,
      minlength: [2, 'Category tag must be at least 2 characters'],
      maxlength: [30, 'Category tag must be at most 30 characters'],
      match: [
        /^[a-z0-9-]+$/,
        'Category tag must contain only lowercase letters, numbers, and hyphens',
      ],
    },
    estimatedHours: {
      type: Number,
      required: [true, 'Estimated hours is required'],
      min: [0.01, 'Estimated hours must be greater than 0'],
      max: [500, 'Estimated hours must be at most 500'],
    },
  },
  { timestamps: true }
);

scopeItemSchema.index({ projectId: 1 });

module.exports = mongoose.model('ScopeItem', scopeItemSchema);
