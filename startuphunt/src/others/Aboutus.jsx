import React from "react";

const Aboutus = () => {
    return (
        <div className="min-h-screen bg-white pt-16">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-6">
                        About LaunchIT
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Empowering the next generation of entrepreneurs to discover, launch, and scale their innovative ideas.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 mb-16">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                            Our Mission
                        </h2>
                        <p className="text-gray-700 leading-relaxed">
                            LaunchIT is dedicated to democratizing access to startup discovery and launch opportunities.
                            We believe that great ideas can come from anywhere, and everyone deserves a chance to bring
                            their vision to life.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                            Our Vision
                        </h2>
                        <p className="text-gray-700 leading-relaxed">
                            To become the world's leading platform for early-stage startup discovery, connecting
                            entrepreneurs with the resources, community, and opportunities they need to succeed.
                        </p>
                    </div>
                </div>

                <div className="bg-blue-50 p-8 rounded-xl mb-16">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                        What We Do
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-2">Startup Discovery</h3>
                            <p className="text-gray-600 text-sm">
                                Browse and discover innovative early-stage startups and projects from around the world.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-2">Project Launch</h3>
                            <p className="text-gray-600 text-sm">
                                Submit and showcase your startup ideas to a global community of entrepreneurs and investors.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-2">Community</h3>
                            <p className="text-gray-600 text-sm">
                                Connect with like-minded entrepreneurs, share insights, and build meaningful relationships.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mb-16">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                        Our Values
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-2">Innovation</h3>
                                <p className="text-gray-600">
                                    We celebrate creativity and encourage out-of-the-box thinking in everything we do.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-2">Community</h3>
                                <p className="text-gray-600">
                                    We believe in the power of collaboration and building strong, supportive networks.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-2">Transparency</h3>
                                <p className="text-gray-600">
                                    We operate with honesty and openness, building trust with our community.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-2">Impact</h3>
                                <p className="text-gray-600">
                                    We're driven by the desire to create positive change through entrepreneurship.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                        Join Our Mission
                    </h2>
                    <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                        Whether you're an entrepreneur with a groundbreaking idea, an investor looking for the next big thing,
                        or simply passionate about innovation, LaunchIT is your platform to connect, collaborate, and create.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="/submit"
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Submit Your Startup
                        </a>
                        <a
                            href="/projects"
                            className="bg-gray-100 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                        >
                            Discover Startups
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Aboutus;