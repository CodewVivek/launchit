import React from "react";

const PrivacyPolicy = () => (
  <div className="max-w-3xl mx-auto py-12 px-4">
    <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
    <p className="mb-4">
      This Privacy Policy describes how Launch It (the "Platform") collects,
      uses, and protects your information when you use our website to discover,
      submit, and interact with startups.
    </p>
    <p>
      Privacy Policy for Startuphunt
      Effective Date: August 6, 2025

      1. Introduction
      Startuphunt (“we”, “our”, “us”) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform to discover, launch, and interact with startups.

      2. Information We Collect
      Account Information: When you register, we collect your name, email address, and profile details (such as avatar).
      Startup Submissions: If you submit a startup, we collect details such as name, description, website, logo, images, and related metadata.
      Usage Data: We collect data about how you use our platform, including pages visited, search queries, and interactions (likes, comments, shares).
      Device & Technical Data: We may collect device type, browser, operating system, and IP address for analytics and security.
      Communications: If you contact us, we may collect your message and contact information.
      3. How We Use Your Information
      To provide and improve our services.
      To personalize your experience.
      To communicate with you about your account, updates, or support requests.
      To analyze usage and improve platform performance.
      To detect and prevent fraud or abuse.
      4. How We Share Your Information
      Public Content: Startups and comments you post are visible to other users.
      Service Providers: We may share data with third-party services for hosting, analytics, and email delivery (e.g., Supabase, analytics tools).
      Legal Compliance: We may disclose information if required by law or to protect our rights and users.
      5. Data Security
      Your data is stored securely using industry-standard encryption and access controls.
      Sensitive actions are protected by authentication and authorization checks.
      We enforce Row Level Security (RLS) in our database to ensure users can only access their own data.
      6. Your Choices
      You can update your profile and account information at any time.
      You may delete your account, which will remove your personal data from our systems (subject to legal requirements).
      You can control what information you share publicly on your profile.
      7. Cookies & Tracking
      We use cookies and similar technologies for authentication and analytics.
      You can control cookies via your browser settings.
      8. Children’s Privacy
      Our platform is not intended for children under 13. We do not knowingly collect data from children.
      9. Changes to This Policy
      We may update this Privacy Policy from time to time. We will notify you of significant changes.
      10. Contact Us
      For questions about this policy, contact us at: [your email/contact form]
    </p>
    <h2 className="text-xl font-semibold mt-8 mb-2">1. What We Collect</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>
        <b>Profile Information:</b> When you sign up (via Google), we collect
        your name, email, and profile picture.
      </li>
      <li>
        <b>Project Data:</b> When you submit a project, we store the details you
        provide (name, description, media, etc.).
      </li>
      <li>
        <b>Interactions:</b> We record your likes, comments, and other activity
        on the platform.
      </li>
      <li>
        <b>Usage Data:</b> We collect analytics on how you use the platform to
        improve our services.
      </li>
      <li>
        <b>Cookies:</b> We use cookies for authentication and to enhance your
        experience.
      </li>
    </ul>
    <h2 className="text-xl font-semibold mt-8 mb-2">2. How We Use Your Data</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>To provide, maintain, and improve the Platform.</li>
      <li>To personalize your experience and show relevant content.</li>
      <li>To communicate with you about updates, features, and support.</li>
      <li>To ensure security and prevent abuse.</li>
    </ul>
    <h2 className="text-xl font-semibold mt-8 mb-2">3. Sharing & Disclosure</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>
        We do <b>not</b> sell your personal information.
      </li>
      <li>
        We may share data with trusted service providers who help us operate the
        Platform.
      </li>
      <li>
        We may disclose information if required by law or to protect our rights.
      </li>
    </ul>
    <h2 className="text-xl font-semibold mt-8 mb-2">4. Data Security</h2>
    <p className="mb-4">
      We use industry-standard security measures to protect your data. However,
      no method of transmission over the Internet is 100% secure.
    </p>
    <h2 className="text-xl font-semibold mt-8 mb-2">5. Your Choices</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>You can update your profile information at any time.</li>
      <li>
        You can delete your account, which will remove your data from our
        platform.
      </li>
      <li>You can opt out of non-essential communications.</li>
    </ul>
    <h2 className="text-xl font-semibold mt-8 mb-2">
      6. Changes to This Policy
    </h2>
    <p className="mb-4">
      We may update this Privacy Policy from time to time. We will notify you of
      any significant changes by posting the new policy on this page.
    </p>
    <h2 className="text-xl font-semibold mt-8 mb-2">7. Contact Us</h2>
    <p>
      If you have any questions about this Privacy Policy, please contact us at{" "}
      <a href="mailto:support@launchit.com" className="text-blue-600 underline">
        support@launchit.com
      </a>
      .
    </p>
  </div>
);

export default PrivacyPolicy;
