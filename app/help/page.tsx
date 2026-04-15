'use client';

import Sidebar from '@/components/Sidebar';
import { Search, Bell, Plus, Minus } from 'lucide-react';
import { useState } from 'react';

const faqs = [
    {
        question: 'What is LinkHive?',
        answer: 'LinkHive is a powerful URL shortening platform that allows you to create short, memorable links, track their performance with detailed analytics, and manage campaigns with influencer tracking capabilities.'
    },
    {
        question: 'Is LinkHive free to use?',
        answer: 'Yes! LinkHive offers a free tier with essential features. For advanced features like custom domains, detailed analytics, and campaign management, we offer premium plans.'
    },
    {
        question: 'How does the Quick vs. Advanced toggle work??',
        answer: 'The Quick mode provides a simplified interface for basic URL shortening. Advanced mode unlocks additional features like custom aliases, password protection, expiry dates, and campaign tracking.'
    },
    {
        question: 'How do I create a shortened URL?',
        answer: 'Simply paste your long URL into the destination field, optionally customize the short URL alias, and click "Shorten My Link". Your shortened URL will be ready instantly with a QR code!'
    },
    {
        question: 'Can I update the destination of a shortened URL?',
        answer: 'Yes! You can edit the destination URL of your shortened links at any time from your dashboard. This is especially useful for updating campaign links without changing the short URL.'
    },
    {
        question: 'Can I set an expiration date for my links?',
        answer: 'Absolutely! In Advanced mode, you can set an expiration date for your shortened links. After the expiry date, the link will no longer redirect to the destination.'
    },
    {
        question: 'Can I use LinkHive without creating an account?',
        answer: 'While you can create shortened links without an account, signing up gives you access to analytics, link management, campaign tracking, and the ability to edit your links later.'
    }
];

export default function HelpPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [copyLabel, setCopyLabel] = useState('Copy');

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const handleCopyEmail = async () => {
        try {
            await navigator.clipboard.writeText('contact@linkhive.in');
            setCopyLabel('Copied!');
        } catch {
            setCopyLabel('Failed');
        } finally {
            setTimeout(() => setCopyLabel('Copy'), 1500);
        }
    };

    return (
        <div className="flex h-screen bg-gray-950">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">🏠</span>
                            <span className="text-gray-500">›</span>
                            <span className="text-white font-medium">Dashboard</span>
                            <span className="text-gray-500">›</span>
                            <span className="text-blue-400">Help & FAQs</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search"
                                    className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-64"
                                />
                            </div>
                            <button
                                type="button"
                                aria-label="Notifications"
                                className="relative p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
                            >
                                <Bell className="w-5 h-5 text-gray-400" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-6 relative">
                    {/* Gradient Decorations */}
                    <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20"></div>
                    <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-3xl opacity-20"></div>
                    <div className="absolute bottom-20 left-1/3 w-36 h-36 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full blur-3xl opacity-20"></div>

                    <div className="max-w-4xl mx-auto relative z-10">
                        {/* Title */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-white mb-2">FAQs</h1>
                            <p className="text-gray-400">
                                Do you need some help with something or do you have questions on some features?
                            </p>
                        </div>

                        {/* FAQ Accordion */}
                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div
                                    key={index}
                                    className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden transition-all hover:border-gray-700"
                                >
                                    <button
                                        onClick={() => toggleFAQ(index)}
                                        className="w-full flex items-center justify-between p-5 text-left"
                                    >
                                        <span className="text-white font-medium pr-4">
                                            {faq.question}
                                        </span>
                                        <div className="shrink-0 w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                                            {openIndex === index ? (
                                                <Minus className="w-4 h-4 text-gray-400" />
                                            ) : (
                                                <Plus className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                    </button>

                                    {openIndex === index && (
                                        <div className="px-5 pb-5 animate-in slide-in-from-top-2">
                                            <p className="text-gray-400 leading-relaxed">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Contact Section */}
                        <div className="mt-12 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-8 text-center">
                            <h2 className="text-2xl font-bold text-white mb-3">
                                Have any other questions ?
                            </h2>
                            <p className="text-gray-400 mb-6">
                                Don&apos;t hesitate to send us an email with your enquiry or statement at :
                            </p>
                            <div className="flex items-center justify-center gap-3">
                                <div className="bg-gray-800 border border-gray-700 rounded-lg px-6 py-3">
                                    <span className="text-blue-400 font-medium">contact@linkhive.in</span>
                                </div>
                                <button
                                    onClick={handleCopyEmail}
                                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 hover:bg-gray-700 transition-colors"
                                >
                                    <span className="text-gray-300 text-sm">📋 {copyLabel}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
