import React from "react";

const TERMS_SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    text: "By accessing or using TalentLink, you agree to be bound by these Terms of Service and our Privacy Policy.",
  },
  {
    title: "2. User Accounts",
    text: "You must register an account to use TalentLink. You are responsible for all activities under your account. Keep your credentials secure.",
  },
  {
    title: "3. Use of Services",
    text: "TalentLink is intended to connect clients and freelancers. You agree not to misuse the platform for illegal activities or harassment.",
  },
  {
    title: "4. Payments and Fees",
    text: "All payments must go through TalentLink’s secure system. You agree to pay all fees applicable to your use of the platform.",
  },
  {
    title: "5. Termination",
    text: "TalentLink may suspend or terminate your account if you violate these Terms or engage in harmful behavior.",
  },
  {
    title: "6. Limitation of Liability",
    text: "TalentLink is not liable for any direct or indirect damages resulting from use of the platform.",
  },
  {
    title: "7. Changes to Terms",
    text: "We may update these Terms from time to time. Continued use of TalentLink after updates constitutes acceptance.",
  },
];

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <h1 className="text-4xl font-bold text-purple-700 text-center mb-4">
          Terms of Service
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Please read these terms carefully before using TalentLink services.
        </p>

        {/* Terms Sections with hover animation */}
        {TERMS_SECTIONS.map((section, idx) => (
          <section
            key={idx}
            className="mb-6 bg-white shadow-xl rounded-xl p-6 transition-all duration-300 hover:shadow-2xl hover:border-2 hover:border-purple-500 hover:scale-[1.02]"
          >
            <h2 className="text-2xl font-semibold text-purple-700 mb-2">
              {section.title}
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed">{section.text}</p>
          </section>
        ))}

        {/* Footer */}
        <footer className="text-gray-500 text-center mt-12 text-sm">
          © 2025 TalentLink. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default TermsOfService;
