import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash'],
    required: true
  },
  // For simulated card payments (we do NOT store full card numbers or CVV)
  card: {
    holderName: { type: String },
    last4: { type: String },
    brand: { type: String },
    expiryMonth: { type: Number, min: 1, max: 12 },
    expiryYear: { type: Number }
  },
  // For offline methods (bank transfer / cash): base64 image proof
  proofImage: { type: String },
  proofUploadedAt: { type: Date },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  trialExpired: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: ''
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundDate: {
    type: Date
  },
  refundReason: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ student: 1, course: 1 });
paymentSchema.index({ teacher: 1, paymentDate: -1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ paymentDate: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;