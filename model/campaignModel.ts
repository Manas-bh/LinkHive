import mongoose, { Schema, Document } from 'mongoose';

export interface IInfluencer {
  influencerId: string;
  name: string;
  customSlug?: string;
  urlId?: mongoose.Types.ObjectId;
}

export interface ICampaign extends Document {
  name: string;
  description: string;
  userId: mongoose.Types.ObjectId;
  destinationUrl: string;
  influencers: IInfluencer[];
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'paused' | 'completed';
  
  // Aggregated metrics (computed fields)
  totalClicks?: number;
  totalUniqueVisitors?: number;
}

const InfluencerSchema = new Schema({
  influencerId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  customSlug: {
    type: String,
  },
  urlId: {
    type: Schema.Types.ObjectId,
    ref: 'Url',
  },
}, { _id: false });

const CampaignSchema = new Schema<ICampaign>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  destinationUrl: {
    type: String,
    required: true,
  },
  influencers: [InfluencerSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed'],
    default: 'active',
  },
  totalClicks: {
    type: Number,
    default: 0,
  },
  totalUniqueVisitors: {
    type: Number,
    default: 0,
  },
});

// Middleware to update the updatedAt field before saving
CampaignSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes for better query performance
CampaignSchema.index({ userId: 1, status: 1 });
CampaignSchema.index({ createdAt: -1 });

// Create and export the model
const Campaign = mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);

export default Campaign;
