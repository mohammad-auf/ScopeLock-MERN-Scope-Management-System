const mongoose = require('mongoose');

const changeOrderSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientRequest',
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    estimatedHours: {
      type: Number,
      required: [true, 'Estimated hours is required'],
      min: [0.01, 'Estimated hours must be greater than 0'],
      max: [500, 'Estimated hours must be at most 500'],
    },
    // Computed: estimatedHours × project.hourlyRate (set in controller, never by client)
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    isBlocking: {
      type: Boolean,
      default: false,
    },
    // Valid transitions: draft → sent → approved | declined (enforced in controller)
    status: {
      type: String,
      enum: ['draft', 'sent', 'approved', 'declined'],
      default: 'draft',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

changeOrderSchema.index({ projectId: 1 });
changeOrderSchema.index({ requestId: 1 });

module.exports = mongoose.model('ChangeOrder', changeOrderSchema);
