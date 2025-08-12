import React from "react";

const TermsOfService = () => (
  <div className="max-w-3xl mx-auto py-12 px-4">
    <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
    <p className="mb-4">
      Welcome to Launch It! These Terms of Service govern your use of our
      platform. By using Launch It, you agree to these terms.
    </p>
    <h2 className="text-xl font-semibold mt-8 mb-2">1. Acceptance of Terms</h2>
    <p className="mb-4">
      By accessing or using Launch It, you agree to be bound by these Terms of
      Service and our Privacy Policy.
    </p>
    <h2 className="text-xl font-semibold mt-8 mb-2">2. User Accounts</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>
        You must provide accurate and complete information when creating an
        account (via Google sign-in).
      </li>
      <li>
        You are responsible for maintaining the confidentiality of your account
        credentials.
      </li>
      <li>
        You are responsible for all activities that occur under your account.
      </li>
    </ul>
    <h2 className="text-xl font-semibold mt-8 mb-2">3. Acceptable Use</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>Do not use Launch It for any unlawful or harmful purpose.</li>
      <li>Do not harass, abuse, or harm other users.</li>
      <li>
        Do not upload or share content that is offensive, illegal, or infringes
        on others' rights.
      </li>
      <li>Do not attempt to disrupt or compromise the platform's security.</li>
    </ul>
    <h2 className="text-xl font-semibold mt-8 mb-2">4. Content Ownership</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>
        You retain ownership of the content you submit to Launch It (projects,
        comments, etc.).
      </li>
      <li>
        By posting content, you grant us a license to use, display, and
        distribute it on the platform.
      </li>
      <li>We reserve the right to remove content that violates these terms.</li>
    </ul>
    <h2 className="text-xl font-semibold mt-8 mb-2">5. Termination</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>
        We may suspend or terminate your account if you violate these terms.
      </li>
      <li>You may delete your account at any time.</li>
    </ul>
    <h2 className="text-xl font-semibold mt-8 mb-2">
      6. Disclaimer & Limitation of Liability
    </h2>
    <p className="mb-4">
      Launch It is provided "as is" without warranties of any kind. We are not
      liable for any damages resulting from your use of the platform.
    </p>
    <h2 className="text-xl font-semibold mt-8 mb-2">7. Changes to Terms</h2>
    <p className="mb-4">
      We may update these Terms of Service from time to time. We will notify you
      of significant changes by posting the new terms on this page.
    </p>
    <h2 className="text-xl font-semibold mt-8 mb-2">8. Contact Us</h2>
    <p>
      If you have any questions about these Terms of Service, please contact us
      at{" "}
      <a href="mailto:support@launchit.com" className="text-blue-600 underline">
        support@launchit.com
      </a>
      .
    </p>
  </div>
);

export default TermsOfService;
