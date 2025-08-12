import React, { useState } from "react";
import { Rocket, Mail, ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const ComingSoon = () => {
    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-800 mb-2">
                            Advertise
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                            Boost your startup's visibility and reach with our premium highlighting packages.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* 99/- Package */}
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                            <div className="text-center mb-8">

                                <h3 className="text-3xl font-bold text-gray-800 mb-2">Quick Boost</h3>
                                <div className="text-5xl font-bold text-blue-600 mb-2">₹199</div>
                                <p className="text-gray-600">Full Day Highlight</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-700 font-medium">Full Day Dashboard Highlighted</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-gray-700 font-medium">Trending Projects Section</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-gray-700 font-medium">Special Badge Display</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-gray-700 font-medium">Homepage Boost</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-gray-700 font-medium">Priority Visibility</span>
                                </div>
                            </div>

                            <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                                Get Quick Boost - ₹199
                            </button>
                        </div>

                        {/* 499/599/- Package */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 relative">
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex flex-row gap-1 items-center justify-center">
                                    <Sparkles className="w-4 h-4" />
                                    PREMIUM
                                </span>
                            </div>

                            <div className="text-center mb-8">
                                <h3 className="text-3xl font-bold text-gray-800 mb-2">Extended Reach</h3>
                                <div className="text-5xl font-bold text-purple-600 mb-2">₹499</div>
                                <p className="text-gray-600">1 Week Highlight</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-gray-700 font-medium">1 Week Dashboard Highlighted</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-gray-700 font-medium">Trending Projects Section</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-gray-700 font-medium">Special Badge Display</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-gray-700 font-medium">Homepage Boost</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-gray-700 font-medium">Analytics Dashboard Access</span>
                                </div>
                            </div>

                            <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                                Get Extended Reach - ₹499
                            </button>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-12 text-center">
                        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">
                                Why Choose Paid Highlights?
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Sparkles className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Increased Visibility</h4>
                                    <p className="text-gray-600 text-sm">Get noticed by investors and potential partners</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Premium Badge</h4>
                                    <p className="text-gray-600 text-sm">Stand out with exclusive highlighting</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Sparkles className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Homepage Boost</h4>
                                    <p className="text-gray-600 text-sm">Featured placement on the main page</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComingSoon; 