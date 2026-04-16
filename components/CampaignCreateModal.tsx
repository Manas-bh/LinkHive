'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CampaignCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function CampaignCreateModal({
    isOpen,
    onClose,
    onSuccess,
}: CampaignCreateModalProps) {
    const [name, setName] = useState('');
    const [destinationUrl, setDestinationUrl] = useState('');
    const [influencers, setInfluencers] = useState<Array<{ influencerId: string; name: string }>>([
        { influencerId: '', name: '' },
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const addInfluencer = () => {
        setInfluencers([...influencers, { influencerId: '', name: '' }]);
    };

    const removeInfluencer = (index: number) => {
        setInfluencers(influencers.filter((_, i) => i !== index));
    };

    const updateInfluencer = (index: number, field: 'influencerId' | 'name', value: string) => {
        const updated = [...influencers];
        updated[index][field] = value;
        setInfluencers(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/campaign', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    destinationUrl,
                    influencers: influencers.filter(inf => inf.influencerId && inf.name),
                }),
            });

            const data = await response.json();

            if (data.success) {
                setName('');
                setDestinationUrl('');
                setInfluencers([{ influencerId: '', name: '' }]);
                onSuccess?.();
                onClose();
            } else {
                setError(data.error || 'Failed to create campaign');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-8 relative border border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Create New Campaign
                    </h2>
                    <p className="text-sm text-gray-400">
                        Create a campaign to track multiple influencer links
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Campaign Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Campaign Name *
                        </label>
                        <Input
                            type="text"
                            placeholder="Summer Sale Campaign"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                        />
                    </div>

                    {/* Destination URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Destination URL *
                        </label>
                        <Input
                            type="url"
                            placeholder="https://example.com/summer-sale"
                            value={destinationUrl}
                            onChange={(e) => setDestinationUrl(e.target.value)}
                            required
                            className="h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                        />
                    </div>

                    {/* Influencers */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-300">
                                Influencers *
                            </label>
                            <Button
                                type="button"
                                onClick={addInfluencer}
                                variant="ghost"
                                size="sm"
                                className="text-blue-400 hover:text-blue-300"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Influencer
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {influencers.map((influencer, index) => (
                                <div key={index} className="flex gap-3">
                                    <Input
                                        type="text"
                                        placeholder="Influencer ID (e.g., john_doe)"
                                        value={influencer.influencerId}
                                        onChange={(e) => updateInfluencer(index, 'influencerId', e.target.value)}
                                        required
                                        className="flex-1 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                                    />
                                    <Input
                                        type="text"
                                        placeholder="Name"
                                        value={influencer.name}
                                        onChange={(e) => updateInfluencer(index, 'name', e.target.value)}
                                        required
                                        className="flex-1 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                                    />
                                    {influencers.length > 1 && (
                                        <Button
                                            type="button"
                                            onClick={() => removeInfluencer(index)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="outline"
                            className="flex-1 h-12 bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !name || !destinationUrl || influencers.every(i => !i.influencerId)}
                            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {loading ? 'Creating...' : 'Create Campaign'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
