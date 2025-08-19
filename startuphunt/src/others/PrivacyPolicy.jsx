import React from "react";

const PrivacyPolicy = () => (
  <div className="max-w-4xl mx-auto py-12 px-4">
    <h1 className="text-4xl font-bold mb-8 text-center">Privacy Policy</h1>

    <div className="bg-blue-50 p-6 rounded-lg mb-8">
      <p className="text-lg text-blue-800">
        <strong>Effective Date:</strong> August 17, 2025
      </p>
      <p className="text-blue-800 mt-2">
        <strong>Last Updated:</strong> August 17, 2025
      </p>
    </div>

    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">1. Introduction</h2>
        <p className="text-gray-700 leading-relaxed">
          launchit ("we", "our", "us") is a platform dedicated to discovering, showcasing, and launching early-stage startups and innovative projects.
          We are committed to protecting your privacy and ensuring transparency about how we collect, use, and protect your information.
        </p>
        <p className="text-gray-700 leading-relaxed mt-3">
          This Privacy Policy explains how we handle your information when you use our platform to discover startups, submit your own projects,
          interact with other users, and engage with our community features.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">2. What We Do</h2>
        <div className="bg-gray-50 p-6 rounded-lg">
          <p className="text-gray-700 mb-3">
            <strong>launchit is a startup discovery and launch platform that:</strong>
          </p>
          <ul className="list-disc ml-6 text-gray-700 space-y-2">
            <li>Allows users to discover and explore early-stage startups and projects</li>
            <li>Enables entrepreneurs to submit and showcase their startup ideas</li>
            <li>Facilitates community interaction through comments, likes, and sharing</li>
            <li>Provides tools for project categorization and discovery</li>
            <li>Offers a platform for networking and collaboration among startup enthusiasts</li>
            <li>Supports pitch submissions and project validation</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">3. Information We Collect</h2>

        <h3 className="text-xl font-medium mb-3 text-gray-700">3.1 Account Information</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li><strong>Profile Data:</strong> Name, email address, profile picture, and username</li>
          <li><strong>Authentication:</strong> Google OAuth credentials (when using Google sign-in)</li>
          <li><strong>Account Settings:</strong> Preferences, notification settings, and profile visibility</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 text-gray-700">3.2 Startup/Project Submissions</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li><strong>Project Details:</strong> Startup name, description, website, logo, images, and category</li>
          <li><strong>Technical Information:</strong> Built-with technologies, launch status, and project metadata</li>
          <li><strong>Media Content:</strong> Thumbnails, screenshots, and promotional materials you upload</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 text-gray-700">3.3 User Interactions</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li><strong>Engagement Data:</strong> Likes, comments, shares, and project views</li>
          <li><strong>Search Activity:</strong> Search queries, filters used, and browsing patterns</li>
          <li><strong>Community Participation:</strong> Comments, feedback, and community contributions</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 text-gray-700">3.4 Technical Information</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li><strong>Device Data:</strong> Browser type, operating system, and device information</li>
          <li><strong>Usage Analytics:</strong> Page visits, time spent, and feature usage patterns</li>
          <li><strong>Security Data:</strong> IP address, login attempts, and security events</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">4. How We Use Your Information</h2>

        <h3 className="text-xl font-medium mb-3 text-gray-700">4.1 Core Platform Services</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li>Providing and maintaining the launchit platform</li>
          <li>Processing your startup submissions and project uploads</li>
          <li>Enabling user authentication and account management</li>
          <li>Facilitating community interactions and networking</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 text-gray-700">4.2 Platform Improvement</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li>Analyzing usage patterns to improve user experience</li>
          <li>Developing new features based on user needs</li>
          <li>Optimizing platform performance and functionality</li>
          <li>Conducting research on startup trends and user behavior</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 text-gray-700">4.3 Communication</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>Sending important platform updates and announcements</li>
          <li>Providing customer support and responding to inquiries</li>
          <li>Notifying you about community activity and interactions</li>
          <li>Sharing relevant startup news and opportunities</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">5. Information Sharing and Disclosure</h2>

        <h3 className="text-xl font-medium mb-3 text-gray-700">5.1 Public Content</h3>
        <p className="text-gray-700 mb-3">
          <strong>Important:</strong> When you submit a startup or project to launchit, this information becomes publicly visible
          to all platform users. This includes:
        </p>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li>Startup name, description, and website</li>
          <li>Project images, logos, and media content</li>
          <li>Category and technology information</li>
          <li>Launch status and project details</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 text-gray-700">5.2 Service Providers</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li><strong>Hosting Services:</strong> Supabase for database and authentication</li>
          <li><strong>Analytics Tools:</strong> Google Analytics for platform insights</li>
          <li><strong>File Storage:</strong> Secure cloud storage for media uploads</li>
          <li><strong>Email Services:</strong> For notifications and communications</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 text-gray-700">5.3 Legal Requirements</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>Complying with applicable laws and regulations</li>
          <li>Responding to legal requests and court orders</li>
          <li>Protecting our rights and preventing fraud</li>
          <li>Ensuring platform security and user safety</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">6. Data Security and Protection</h2>

        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-xl font-medium mb-3 text-green-800">Security Measures We Implement:</h3>
          <ul className="list-disc ml-6 text-green-700 space-y-2">
            <li><strong>Encryption:</strong> All data is encrypted in transit and at rest</li>
            <li><strong>Access Controls:</strong> Strict authentication and authorization protocols</li>
            <li><strong>Database Security:</strong> Row-level security (RLS) in Supabase</li>
            <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
            <li><strong>Data Backups:</strong> Regular secure backups of all user data</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">7. Your Rights and Choices</h2>

        <h3 className="text-xl font-medium mb-3 text-gray-700">7.1 Account Management</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li>Update your profile information at any time</li>
          <li>Control your privacy settings and visibility preferences</li>
          <li>Manage notification preferences and communication settings</li>
          <li>Download a copy of your data upon request</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 text-gray-700">7.2 Content Control</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li>Edit or remove your startup submissions</li>
          <li>Delete your comments and interactions</li>
          <li>Control what information is publicly visible</li>
          <li>Request removal of content that violates our terms</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 text-gray-700">7.3 Account Deletion</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>Delete your account and remove all personal data</li>
          <li>Request data deletion within 30 days</li>
          <li>Note: Public content may remain visible for community integrity</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">8. Cookies and Tracking Technologies</h2>

        <p className="text-gray-700 mb-3">
          We use cookies and similar technologies to enhance your experience on launchit:
        </p>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li><strong>Authentication Cookies:</strong> To keep you logged in and secure</li>
          <li><strong>Analytics Cookies:</strong> To understand how users interact with our platform</li>
          <li><strong>Preference Cookies:</strong> To remember your settings and preferences</li>
          <li><strong>Security Cookies:</strong> To protect against fraud and abuse</li>
        </ul>

        <p className="text-gray-700">
          You can control cookies through your browser settings, though this may affect platform functionality.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">9. Children's Privacy</h2>
        <p className="text-gray-700">
          launchit is not intended for children under 13 years of age. We do not knowingly collect personal information
          from children under 13. If you are a parent or guardian and believe your child has provided us with personal information,
          please contact us immediately.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">10. International Data Transfers</h2>
        <p className="text-gray-700">
          launchit operates globally, and your information may be transferred to and processed in countries other than your own.
          We ensure that all data transfers comply with applicable data protection laws and implement appropriate safeguards.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">11. Changes to This Privacy Policy</h2>
        <p className="text-gray-700 mb-3">
          We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws.
          When we make significant changes, we will:
        </p>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li>Post the updated policy on this page</li>
          <li>Update the "Last Updated" date</li>
          <li>Notify you through the platform or email for major changes</li>
          <li>Provide a summary of key changes</li>
        </ul>
        <p className="text-gray-700">
          Your continued use of launchit after any changes indicates your acceptance of the updated policy.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">12. Contact Information</h2>

        <div className="bg-blue-50 p-6 rounded-lg">
          <p className="text-gray-700 mb-3">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices,
            please contact us:
          </p>
          <div className="space-y-2">
            <p className="text-gray-700">
              <strong>Email:</strong>{" "}
              <a href="mailto:skypher206@gmail.com" className="text-blue-600 underline hover:text-blue-800">
                skypher206@gmail.com
              </a>
            </p>
            <p className="text-gray-700">
              <strong>Support Email:</strong>{" "}
              <a href="mailto:skypher206@gmail.com" className="text-blue-600 underline hover:text-blue-800">
                skypher206@gmail.com
              </a>
            </p>
            <p className="text-gray-700">
              <strong>Website:</strong>{" "}
              <a href="https://launchit.site" className="text-blue-600 underline hover:text-blue-800">
                https://launchit.site
              </a>
            </p>
          </div>
        </div>
      </section>

      <div className="mt-12 p-6 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-600 text-sm">
          This Privacy Policy is effective as of August 17, 2025.
          We are committed to protecting your privacy and being transparent about our data practices.
        </p>
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;
