import React from "react";

const TermsOfService = () => (
  <div className="max-w-4xl mx-auto py-12 px-4">
    <h1 className="text-4xl font-bold mb-8 text-center">Terms of Service</h1>

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
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">1. Introduction and Acceptance</h2>
        <p className="text-gray-700 leading-relaxed">
          Welcome to LaunchIT! These Terms of Service ("Terms") govern your use of our startup discovery and launch platform.
          By accessing or using LaunchIT, you agree to be bound by these Terms and our Privacy Policy.
        </p>
        <p className="text-gray-700 leading-relaxed mt-3">
          LaunchIT is a platform that connects entrepreneurs, investors, and startup enthusiasts. We provide tools for discovering,
          showcasing, and launching early-stage startups and innovative projects.
        </p>
        <div className="bg-yellow-50 p-4 rounded-lg mt-4">
          <p className="text-yellow-800 text-sm">
            <strong>Important:</strong> If you do not agree to these Terms, please do not use our platform.
            Your continued use of LaunchIT constitutes acceptance of these Terms.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">2. What LaunchIT Does</h2>
        <div className="bg-gray-50 p-6 rounded-lg">
          <p className="text-gray-700 mb-3">
            <strong>LaunchIT is a startup platform that provides:</strong>
          </p>
          <ul className="list-disc ml-6 text-gray-700 space-y-2">
            <li><strong>Startup Discovery:</strong> Browse and discover early-stage startups and innovative projects</li>
            <li><strong>Project Submission:</strong> Submit and showcase your startup ideas to the community</li>
            <li><strong>Community Interaction:</strong> Engage with other users through comments, likes, and sharing</li>
            <li><strong>Pitch Platform:</strong> Submit pitch decks and project proposals for community feedback</li>
            <li><strong>Networking:</strong> Connect with entrepreneurs, investors, and startup enthusiasts</li>
            <li><strong>Resource Sharing:</strong> Access startup-related content and community resources</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">3. User Accounts and Registration</h2>

        <h3 className="text-xl font-medium mb-3 text-gray-700">3.1 Account Creation</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li>You must be at least 13 years old to create an account</li>
          <li>You must provide accurate, current, and complete information during registration</li>
          <li>You are responsible for maintaining the security of your account credentials</li>
          <li>You may use Google OAuth or other approved authentication methods</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 text-gray-700">3.2 Account Responsibilities</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li>You are responsible for all activities that occur under your account</li>
          <li>You must notify us immediately of any unauthorized use of your account</li>
          <li>You may not share your account credentials with others</li>
          <li>You may not create multiple accounts for malicious purposes</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 text-gray-700">3.3 Account Termination</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>You may delete your account at any time through your account settings</li>
          <li>We may suspend or terminate your account for violations of these Terms</li>
          <li>Account termination will remove your personal data but may preserve public content</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">4. Acceptable Use and Community Guidelines</h2>

        <h3 className="text-xl font-medium mb-3 text-gray-700">4.1 What You Can Do</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li>Submit legitimate startup projects and business ideas</li>
          <li>Engage respectfully with other community members</li>
          <li>Share constructive feedback and insights</li>
          <li>Use the platform for networking and collaboration</li>
          <li>Report inappropriate content or behavior</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 text-gray-700">4.2 What You Cannot Do</h3>
        <div className="bg-red-50 p-4 rounded-lg">
          <ul className="list-disc ml-6 text-red-700 space-y-2">
            <li><strong>Illegal Activities:</strong> Use the platform for any unlawful purpose</li>
            <li><strong>Harassment:</strong> Harass, abuse, or harm other users</li>
            <li><strong>Spam:</strong> Post spam, advertisements, or promotional content without permission</li>
            <li><strong>False Information:</strong> Submit fake startups or misleading information</li>
            <li><strong>Intellectual Property:</strong> Infringe on others' copyrights, trademarks, or patents</li>
            <li><strong>Security:</strong> Attempt to hack, disrupt, or compromise platform security</li>
            <li><strong>Impersonation:</strong> Impersonate others or create fake accounts</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">5. Content Submission and Ownership</h2>

        <h3 className="text-xl font-medium mb-3 text-gray-700">5.1 Your Content</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li>You retain ownership of the content you submit to LaunchIT</li>
          <li>You are responsible for the accuracy and legality of your submissions</li>
          <li>You grant us a license to display and distribute your content on the platform</li>
          <li>You represent that you have the right to share the content you submit</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 text-gray-700">5.2 Content Guidelines</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li>Startup submissions must be genuine business ideas or projects</li>
          <li>Content must be appropriate for a professional startup community</li>
          <li>Images and media must be owned by you or properly licensed</li>
          <li>Descriptions should be accurate and not misleading</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 text-gray-700">5.3 Content Moderation</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>We reserve the right to review and moderate all content</li>
          <li>Content that violates these Terms may be removed</li>
          <li>We may suspend accounts for repeated violations</li>
          <li>You can appeal content removal decisions</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">6. Community Features and Interactions</h2>

        <h3 className="text-xl font-medium mb-3 text-gray-700">6.1 Comments and Feedback</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li>Comments should be constructive and respectful</li>
          <li>Personal attacks and hate speech are prohibited</li>
          <li>Spam comments and self-promotion are not allowed</li>
          <li>You can report inappropriate comments for review</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 text-gray-700">6.2 Networking and Connections</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li>You can connect with other users through the platform</li>
          <li>Respect others' privacy and communication preferences</li>
          <li>Do not use connections for spam or harassment</li>
          <li>Professional networking is encouraged</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 text-gray-700">6.3 Community Standards</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>Treat all community members with respect</li>
          <li>Share knowledge and insights constructively</li>
          <li>Help maintain a positive and productive environment</li>
          <li>Report violations to help protect the community</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">7. Intellectual Property and Licensing</h2>

        <h3 className="text-xl font-medium mb-3 text-gray-700">7.1 Platform Intellectual Property</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li>LaunchIT and its content are protected by intellectual property laws</li>
          <li>You may not copy, modify, or distribute our platform code or design</li>
          <li>Our trademarks and branding are our exclusive property</li>
          <li>You may use the platform for its intended purpose only</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 text-gray-700">7.2 User Content Licensing</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li>By submitting content, you grant us a worldwide, non-exclusive license</li>
          <li>This license allows us to display and distribute your content on the platform</li>
          <li>You retain ownership and can remove your content at any time</li>
          <li>Other users may view and interact with your public content</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 text-gray-700">7.3 Third-Party Content</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>We respect third-party intellectual property rights</li>
          <li>If you believe your content was used without permission, contact us</li>
          <li>We will investigate and remove infringing content promptly</li>
          <li>You are responsible for ensuring you have rights to share content</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">8. Privacy and Data Protection</h2>
        <p className="text-gray-700 mb-3">
          Your privacy is important to us. Our collection and use of your information is governed by our Privacy Policy,
          which is incorporated into these Terms by reference.
        </p>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>We collect information necessary to provide our services</li>
          <li>Your data is protected using industry-standard security measures</li>
          <li>We do not sell your personal information to third parties</li>
          <li>You have control over your data and can request deletion</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">9. Platform Availability and Maintenance</h2>

        <h3 className="text-xl font-medium mb-3 text-gray-700">9.1 Service Availability</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li>We strive to maintain 24/7 platform availability</li>
          <li>Service may be temporarily unavailable for maintenance</li>
          <li>We will notify users of planned maintenance when possible</li>
          <li>We are not liable for temporary service interruptions</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 text-gray-700">9.2 Platform Updates</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>We continuously improve and update our platform</li>
          <li>New features may be added or existing ones modified</li>
          <li>We will notify users of significant changes</li>
          <li>Your continued use constitutes acceptance of updates</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">10. Disclaimers and Limitations</h2>

        <div className="bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-xl font-medium mb-3 text-yellow-800">Important Disclaimers:</h3>
          <ul className="list-disc ml-6 text-yellow-700 space-y-2 mb-4">
            <li><strong>No Investment Advice:</strong> LaunchIT does not provide investment, financial, or legal advice</li>
            <li><strong>User Responsibility:</strong> Users are responsible for their own business decisions and due diligence</li>
            <li><strong>Content Accuracy:</strong> We do not verify the accuracy of user-submitted content</li>
            <li><strong>No Guarantees:</strong> We do not guarantee success for any startup or project</li>
          </ul>
        </div>

        <h3 className="text-xl font-medium mb-3 text-gray-700 mt-6">10.1 Limitation of Liability</h3>
        <p className="text-gray-700 mb-3">
          To the maximum extent permitted by law, LaunchIT shall not be liable for any indirect, incidental,
          special, consequential, or punitive damages arising from your use of the platform.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">11. Indemnification</h2>
        <p className="text-gray-700 mb-3">
          You agree to indemnify and hold harmless LaunchIT, its officers, directors, employees, and agents from any claims,
          damages, or expenses arising from:
        </p>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>Your violation of these Terms</li>
          <li>Your use of the platform</li>
          <li>Your content submissions</li>
          <li>Your interactions with other users</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">12. Termination and Suspension</h2>

        <h3 className="text-xl font-medium mb-3 text-gray-700">12.1 Account Termination</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li>You may terminate your account at any time</li>
          <li>We may terminate accounts for Terms violations</li>
          <li>Termination will remove your personal data</li>
          <li>Public content may remain visible for community integrity</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 text-gray-700">12.2 Effect of Termination</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>Your access to the platform will cease immediately</li>
          <li>Your profile and personal data will be removed</li>
          <li>Public content may be preserved for community benefit</li>
          <li>These Terms will continue to apply to any remaining obligations</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">13. Changes to Terms</h2>
        <p className="text-gray-700 mb-3">
          We may update these Terms from time to time to reflect changes in our services, legal requirements,
          or platform functionality. When we make changes, we will:
        </p>
        <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
          <li>Post the updated Terms on this page</li>
          <li>Update the "Last Updated" date</li>
          <li>Notify users of significant changes through the platform</li>
          <li>Provide a summary of key changes when possible</li>
        </ul>
        <p className="text-gray-700">
          Your continued use of LaunchIT after any changes indicates your acceptance of the updated Terms.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">14. Governing Law and Disputes</h2>
        <p className="text-gray-700 mb-3">
          These Terms are governed by the laws of the jurisdiction where LaunchIT operates. Any disputes arising from
          these Terms or your use of the platform will be resolved through:
        </p>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>Direct communication and resolution with our team</li>
          <li>Mediation or alternative dispute resolution methods</li>
          <li>Legal proceedings in the appropriate jurisdiction if necessary</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">15. Contact Information</h2>

        <div className="bg-blue-50 p-6 rounded-lg">
          <p className="text-gray-700 mb-3">
            If you have any questions about these Terms of Service or need assistance, please contact us:
          </p>
          <div className="space-y-2">
            <p className="text-gray-700">
              <strong>Legal Inquiries:</strong>{" "}
              <a href="mailto:legal@launchit.site" className="text-blue-600 underline hover:text-blue-800">
                legal@launchit.site
              </a>
            </p>
            <p className="text-gray-700">
              <strong>Support:</strong>{" "}
              <a href="mailto:support@launchit.site" className="text-blue-600 underline hover:text-blue-800">
                support@launchit.site
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
          These Terms of Service are effective as of August 17, 2025.
          By using LaunchIT, you agree to be bound by these Terms and our Privacy Policy.
        </p>
      </div>
    </div>
  </div>
);

export default TermsOfService;
