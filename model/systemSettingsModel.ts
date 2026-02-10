import mongoose, { Document, Schema } from 'mongoose';

interface ISystemSettings extends Document {
    allowRegistration: boolean;
    maintenanceMode: boolean;
    defaultUrlExpiryDays: number;
    updatedAt: Date;
    updatedBy: string; // Admin email
}

const SystemSettingsSchema = new Schema<ISystemSettings>({
    allowRegistration: {
        type: Boolean,
        default: true,
    },
    maintenanceMode: {
        type: Boolean,
        default: false,
    },
    defaultUrlExpiryDays: {
        type: Number,
        default: 365,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    updatedBy: {
        type: String,
    },
});

// Singleton pattern: ensure only one settings document exists
const SystemSettings = mongoose.models.SystemSettings || mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);

export default SystemSettings;
