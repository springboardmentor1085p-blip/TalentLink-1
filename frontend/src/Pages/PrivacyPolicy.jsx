// frontend/src/pages/PrivacyPolicy.jsx
import React from "react";

const SECTIONS = [
  {
    title: "1. Introduction",
    text: "This Privacy Policy explains how TalentLink collects, uses, and protects your information when you use our platform.",
  },
  {
    title: "2. Information We Collect",
    text: "We may collect personal details such as your name, email address, profile information, project data, communication history, and payment-related information when applicable.",
  },
  {
    title: "3. How We Use Your Information",
    text: "We use your information to provide and improve our services, match freelancers with clients, process payments where applicable, send important updates, and maintain platform security.",
  },
  {
    title: "4. Data Sharing",
    text: "We do not sell your data. We may share limited information with trusted service providers (such as email or payment services) only to the extent necessary to operate TalentLink.",
  },
  {
    title: "5. Data Security",
    text: "We implement reasonable technical and organizational safeguards to protect your information, but no method of transmission over the Internet is 100% secure.",
  },
  {
    title: "6. Your Rights",
    text: "You can update your profile information, request account deletion, and manage communication preferences from within your account settings or by contacting us.",
  },
  {
    title: "7. Changes to This Policy",
    text: "We may update this Privacy Policy from time to time. Continued use of TalentLink after changes means you accept the updated policy.",
  },
  {
    title: "8. Contact",
    text: "If you have any questions about this Privacy Policy, you can contact us via the Contact Us page.",
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-bold text-purple-700 text-center mb-4">
          Privacy Policy
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Your privacy is important to us. Please read this policy carefully.
        </p>

        {/* Sections */}
        {SECTIONS.map((section, idx) => (
          <section
            key={idx}
            className="mb-6 bg-white shadow-xl rounded-xl p-6 transition-all duration-300 hover:shadow-2xl hover:border-2 hover:border-purple-500 hover:scale-[1.02]"
          >
            <h2 className="text-2xl font-semibold text-purple-700 mb-2">
              {section.title}
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              {section.text}
            </p>
          </section>
        ))}

        <footer className="text-gray-500 text-center mt-12 text-sm">
          © 2025 TalentLink. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
