import React from "react";

const TEAM_MEMBERS = [
  { name: "Diksha Divasaliwala", role: "Team Lead, Full Stack Developer", initials: "D" },
  { name: "Yash Khati", role: "Full Stack Developer", initials: "Y" },
  { name: "Chitra Chandra Sowrya", role: "Full Stack Developer", initials: "C" },
  { name: "Rasika S", role: "Full Stack Developer", initials: "R" },
  { name: "Mekala Dinesh Kumar Reddy", role: "Full Stack Developer", initials: "D" },
  { name: "Shivam Patil", role: "Full Stack Developer", initials: "S" },
];

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-5xl font-extrabold text-purple-700 mb-4 drop-shadow">
            About TalentLink
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            TalentLink connects freelancers and clients through smart matchmaking,
            seamless collaboration, and secure communication.
          </p>
        </div>

        {/* Sections with animation and hover border */}
        {[
          { title: "Who We Are", text: "TalentLink empowers freelancers and clients to collaborate efficiently. Our platform simplifies project posting, proposal submission, contract management, and communication while ensuring security and transparency for all users." },
          { title: "Our Mission", text: "To bridge the gap between talented freelancers and clients seeking exceptional work, creating a professional ecosystem where opportunities and skills align perfectly." },
          { title: "Our Vision", text: "A future where every freelancer finds meaningful work, and every client discovers the talent needed to achieve their goals, fostering growth and innovation." },
          { title: "How TalentLink Works", text: "Clients post projects with detailed requirements. Freelancers submit proposals, negotiate terms, and manage contracts. Secure in-app messaging enables smooth communication. Role-based dashboards allow clients and freelancers to track progress. Ratings and reviews help maintain a trustworthy community." }
        ].map((sec, idx) => (
          <section
            key={idx}
            className="mb-12 bg-white shadow-xl rounded-xl p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-2 hover:border-purple-500"
          >
            <h2 className="text-3xl font-semibold text-purple-700 mb-4">
              {sec.title}
            </h2>
            {idx === 3 ? (
              <ul className="list-disc list-inside text-gray-800 text-lg space-y-2">
                {sec.text.split('. ').map((point, i) => point && <li key={i}>{point}.</li>)}
              </ul>
            ) : (
              <p className="text-gray-800 text-lg leading-relaxed">{sec.text}</p>
            )}
          </section>
        ))}

        {/* Team Section */}
        <section className="p-8 rounded-xl bg-white shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-2 hover:border-purple-500">
          <h2 className="text-3xl font-semibold text-purple-700 mb-8 text-center">
            Our Team
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
            {TEAM_MEMBERS.map((member, idx) => (
              <div
                key={idx}
                className="text-center p-4 rounded-xl transition-all duration-300 hover:bg-purple-50 hover:-translate-y-2 hover:shadow-md hover:border-2 hover:border-purple-500 cursor-pointer"
              >
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-300 to-purple-500 text-white flex items-center justify-center text-3xl font-bold shadow-md">
                  {member.initials}
                </div>
                <h3 className="font-semibold text-lg text-gray-900">{member.name}</h3>
                <p className="text-gray-600 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
