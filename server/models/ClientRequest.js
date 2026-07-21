const mongoose = require('mongoose');

const clientRequestSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    requestText: {
      type: String,
      required: [true, 'Request text is required'],
      minlength: [10, 'Request text must be at least 10 characters'],
      maxlength: [2000, 'Request text must be at most 2000 characters'],
      trim: true,
    },
    // Optional; if provided, must match an existing scope item tag (validated in controller)
    categoryTag: {
      type: String,
      trim: true,
      default: null,
    },
    classification: {
      type: String,
      enum: ['in_scope', 'possible_extra', 'unclear'],
      required: true,
    },
    // Null until a change order is generated (BR1: at most one)
    changeOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChangeOrder',
      default: null,
    },
  },
  { timestamps: true }
);

clientRequestSchema.index({ projectId: 1 });
clientRequestSchema.index({ changeOrderId: 1 });

module.exports = mongoose.model('ClientRequest', clientRequestSchema);
