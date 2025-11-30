import React from "react";
import { SEO } from "../Components/SEO";

const HowItWorks = () => {
    return (
        <>
            <SEO
                title="How It Works"
                description="Learn how to launch your startup on Launchit in three simple steps. Submit, get discovered, and build your audience instantly."
                url="https://launchit.site/how-it-works"
            />
            <div className="min-h-screen bg-white pt-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-bold text-gray-900 mb-6">
                            How It Works
                        </h1>
                        <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                            Launch your startup in three simple steps. No waiting, no approval, just instant visibility.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 mb-16">
                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <div className="mb-4">
                                <span className="text-sm font-semibold text-gray-500">STEP 1</span>
                            </div>
                            <h3 className="text-2xl font-semibold mb-4 text-gray-800">Submit Your Startup</h3>
                            <p className="text-gray-700 leading-relaxed">
                                Fill out a simple form with your project details, add images, and submit. No approval needed — your launch goes live instantly.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div className="mb-4">
                                <span className="text-sm font-semibold text-gray-500">STEP 2</span>
                            </div>
                            <h3 className="text-2xl font-semibold mb-4 text-gray-800">Get Discovered</h3>
                            <p className="text-gray-700 leading-relaxed">
                                Your project appears on the homepage immediately, where makers, founders, and early adopters can discover and engage with it.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center">
                            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="mb-4">
                                <span className="text-sm font-semibold text-gray-500">STEP 3</span>
                            </div>
                            <h3 className="text-2xl font-semibold mb-4 text-gray-800">Build Your Audience</h3>
                            <p className="text-gray-700 leading-relaxed">
                                Receive feedback, gather upvotes, and connect with potential users and collaborators who are interested in what you're building.
                            </p>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-8 rounded-xl mb-12">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                            Ready to Launch?
                        </h2>
                        <p className="text-center text-gray-700 mb-8 max-w-2xl mx-auto">
                            Join thousands of founders who have launched their projects on Launchit. Get started in minutes.
                        </p>
                        <div className="text-center">
                            <a
                                href="/submit"
                                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                            >
                                Submit Your Startup
                            </a>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-2xl font-semibold mb-4 text-gray-800">No Waiting Period</h3>
                            <p className="text-gray-700 leading-relaxed">
                                Unlike other platforms, Launchit doesn't make you wait. Your project goes live the moment you submit it.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-semibold mb-4 text-gray-800">No Moderator Approval</h3>
                            <p className="text-gray-700 leading-relaxed">
                                We trust our community. Your project is published instantly without needing approval from moderators.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-semibold mb-4 text-gray-800">Instant Visibility</h3>
                            <p className="text-gray-700 leading-relaxed">
                                Your startup appears on the homepage immediately, giving you maximum exposure from day one.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-semibold mb-4 text-gray-800">Free Forever</h3>
                            <p className="text-gray-700 leading-relaxed">
                                Launching on Launchit is completely free. No fees, no subscriptions, no hidden costs.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HowItWorks;

