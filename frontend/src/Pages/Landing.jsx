import { Link } from 'react-router-dom';
import { useState } from 'react'; 
import {
  Briefcase,
  Users,
  MessageSquare,
  Rocket,
  Target,
  FileCheck,
  Lock,
  Sparkles,
  Handshake,
  ThumbsUp,
  ShieldCheck,
} from 'lucide-react';

export default function Landing({ user }) {
  // State for hero button bar
  const [heroBarStyle, setHeroBarStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0, 
  });

  // Handlers for hero button bar
  const handleHeroBtnHover = (e) => {
    const el = e.currentTarget;
    setHeroBarStyle({
      left: el.offsetLeft,
      width: el.offsetWidth,
      opacity: 1,
    });
  };

  const handleHeroBtnLeave = () => {
    setHeroBarStyle((s) => ({ ...s, opacity: 0 }));
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white min-h-screen flex items-center">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in">
              Work that clicks.<br />
              <span className="text-purple-200">Freelancers that stick.</span>
            </h1>
            <p className="text-xl md:text-3xl mb-10 text-purple-100 font-light">
              Find talent. Skip the scroll.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link
                  to={
                    user.role === 'client'
                      ? '/dashboard/client'
                      : '/dashboard/freelancer'
                  }
                  className="px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>

                  <div
                    className="flex flex-col sm:flex-row gap-4 justify-center relative"
                    onMouseLeave={handleHeroBtnLeave}
                  >
                    <Link
                      to="/signup?role=freelancer"
                      className="relative px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold text-lg transition-all duration-300 hover:bg-white hover:text-purple-700 no-underline"
                      onMouseEnter={handleHeroBtnHover}
                    >
                      Find Work
                    </Link>

                    <Link
                      to="/signup?role=client"
                      className="relative px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold text-lg transition-all duration-300 hover:bg-white hover:text-purple-700 no-underline"
                      onMouseEnter={handleHeroBtnHover}
                    >
                      Hire Talent
                    </Link>

                    {/* ONE white sliding bar */}
                    <span
                      className="absolute -bottom-3 h-1 bg-white rounded-full transition-all duration-300 ease-out pointer-events-none"
                      style={heroBarStyle}
                      aria-hidden="true"
                    />
                  </div>

                </>
              )}
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-6 mt-16 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">500+</div>
                <div className="text-purple-200">Projects Posted</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">1000+</div>
                <div className="text-purple-200">Freelancers</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">98%</div>
                <div className="text-purple-200">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How TalentLink Works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-900">
            How TalentLink Works
          </h2>
          <p className="text-center text-gray-600 mb-16 text-lg">
            A simple process that keeps things clear, quick, and connected.
          </p>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 transition">
                <Target className="text-purple-600" size={40} />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Post Your Project</h3>
              <p className="text-gray-600 text-lg">
                Describe what you need done — from design to development — and set
                your timeline and budget.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 transition">
                <Users className="text-purple-600" size={40} />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Receive Proposals</h3>
              <p className="text-gray-600 text-lg">
                Freelancers review your post and send detailed proposals — pick
                the one that fits best.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 transition">
                <FileCheck className="text-purple-600" size={40} />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Work & Complete</h3>
              <p className="text-gray-600 text-lg">
                Chat, collaborate, and securely complete your project — all inside
                TalentLink.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose TalentLink  */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900">
            Why Choose TalentLink?
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: ShieldCheck,
                title: 'Safe & Transparent',
                desc: 'Work confidently with clear contracts, protected payments, and verified users.',
              },
              {
                icon: MessageSquare,
                title: 'Seamless Communication',
                desc: 'Built-in chat keeps discussions, files, and feedback in one place — no clutter.',
              },
              {
                icon: Briefcase,
                title: 'Real Projects, Real People',
                desc: 'Find genuine opportunities posted by clients and freelancers who mean business.',
              },
              {
                icon: ThumbsUp,
                title: 'Trust That Grows',
                desc: 'Ratings and reviews help build credibility and lasting professional relationships.',
              },
            ].map((benefit, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition"
              >
                <div className="bg-purple-100 p-3 rounded-lg">
                  <benefit.icon className="text-purple-600" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-20 bg-gradient-to-r from-purple-600 to-purple-800 text-white text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-10 text-purple-100">
              Join thousands of professionals already using TalentLink
            </p>
            <Link
              to="/signup"
              className="inline-block px-10 py-4 bg-white text-purple-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Create Your Free Account
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

