import React, { useState } from "react";
import { SEO } from "../Components/SEO";
import { ChevronDown, ChevronUp } from "lucide-react";

const FAQ = () => {
    const [openFaq, setOpenFaq] = useState(null);

    const faqs = [
        {
            question: "How do I submit my startup?",
            answer: "Click the 'Submit Your Startup' button, fill out the form with your project details, add images and links, then submit. Your launch will go live instantly without any approval process."
        },
        {
            question: "Is there a cost to launch on Launchit?",
            answer: "No, launching your startup on Launchit is completely free. There are no fees, subscriptions, or hidden costs."
        },
        {
            question: "How long does it take for my project to appear?",
            answer: "Your project appears immediately after submission. There's no waiting period or moderation queue — it goes live instantly."
        },
        {
            question: "Can I edit my project after launching?",
            answer: "Yes, you can edit your project at any time. Simply go to your project page and click the edit button to update any details."
        },
        {
            question: "Who can see my project?",
            answer: "Your project is visible to everyone who visits Launchit. It appears on the homepage, in category listings, and in search results. You can also share direct links to your project page."
        },
        {
            question: "What information do I need to submit?",
            answer: "You'll need your project name, website URL, tagline, description, category, and at least one image (logo, thumbnail, or cover image). Additional details like links, tags, and technologies are optional but recommended."
        },
        {
            question: "Can I delete my project?",
            answer: "Yes, you can delete your project at any time from your project's edit page. Once deleted, it will be removed from Launchit permanently."
        },
        {
            question: "How do I get more visibility for my project?",
            answer: "Engage with the community by responding to feedback, sharing your project on social media, and keeping your project details updated. Projects with more engagement tend to get more visibility."
        },
        {
            question: "What types of projects can I launch?",
            answer: "You can launch any type of startup, product, or project. This includes SaaS products, mobile apps, web applications, hardware, services, and more. As long as it's a real project you're working on, you're welcome to launch it."
        },
        {
            question: "Do I need to have a working product to launch?",
            answer: "No, you can launch projects at any stage — from idea to beta to fully launched. Launchit is designed to help early-stage projects get visibility and feedback."
        }
    ];

    return (
        <>
            <SEO
                title="Frequently Asked Questions"
                description="Find answers to common questions about launching your startup on Launchit. Learn about the submission process, visibility, editing, and more."
                url="https://launchit.site/faq"
            />
            <div className="min-h-screen bg-white pt-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-6">
                            Frequently Asked Questions
                        </h1>
                        <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                            Everything you need to know about launching your startup on Launchit.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <span className="font-semibold text-gray-900 pr-4 text-lg">{faq.question}</span>
                                    {openFaq === index ? (
                                        <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                    )}
                                </button>
                                {openFaq === index && (
                                    <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
                                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-gray-600 mb-4">
                            Still have questions?
                        </p>
                        <a
                            href="/suggestions"
                            className="text-blue-600 hover:text-blue-700 font-semibold underline"
                        >
                            Contact us or send feedback
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
};

export default FAQ;

