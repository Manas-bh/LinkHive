import mongoose, { Document, Schema } from 'mongoose';

interface IUser extends Document {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;

  // OAuth related fields
  oauthProviders: {
    provider: string;  // 'google', 'github', 'facebook', etc.
    providerId: string;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: Date;
  }[];

  // Subscription related fields
  subscription: {
    type: 'free' | 'premium' | 'pro';
    status: 'active' | 'canceled' | 'expired';
    expiresAt?: Date;
    startedAt?: Date;
    canceledAt?: Date;
    paymentMethod?: string;
    customerId?: string;
    subscriptionId?: string;
    paymentHistory: {
      amount: number;
      currency: string;
      date: Date;
      status: 'paid' | 'failed' | 'refunded';
      transactionId: string;
    }[];
  };
  // URLs created by this user
  urls?: mongoose.Types.ObjectId[];

  // Campaigns created by this user
  campaigns?: mongoose.Types.ObjectId[];

  // Optional additional fields
  isEmailVerified: boolean;
  lastLogin?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isActive: boolean;
  role: 'user' | 'admin';
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String, // Should be hashed before storing
    select: false, // Exclude from query results by default
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  profilePicture: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },

  // OAuth related fields
  oauthProviders: [{
    provider: {
      type: String,
      required: true,
    },
    providerId: {
      type: String,
      required: true,
    },
    accessToken: String,
    refreshToken: String,
    tokenExpiry: Date,
  }],

  // Subscription related fields
  subscription: {
    type: {
      type: String,
      enum: ['free', 'premium', 'pro'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'expired'],
      default: 'active',
    },
    expiresAt: Date,
    startedAt: Date,
    canceledAt: Date,
    paymentMethod: String,
    customerId: String,
    subscriptionId: String,
    paymentHistory: [{
      amount: Number,
      currency: {
        type: String,
        default: 'USD',
      },
      date: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ['paid', 'failed', 'refunded'],
        required: true,
      },
      transactionId: {
        type: String,
        required: true,
      },
    }],
  },


  // References to URLs created by this user
  urls: [{
    type: Schema.Types.ObjectId,
    ref: 'Url',
  }],

  // References to Campaigns created by this user
  campaigns: [{
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
  }],

  // Additional fields
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  lastLogin: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
});

// Middleware to update the updatedAt field before saving
UserSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Create compound index for OAuth providers
UserSchema.index({ 'oauthProviders.provider': 1, 'oauthProviders.providerId': 1 });

// Create index for subscription expiration to enable efficient querying
UserSchema.index({ 'subscription.expiresAt': 1 });

// Add an index for email lookups
UserSchema.index({ email: 1 });

// Create and export the model
const User = mongoose.model<IUser>('User', UserSchema);

export default User;