import { Link } from 'react-router-dom';

export default function Footer({ user }) {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4 text-purple-400">TalentLink</h3>
            <p className="text-gray-400">Connecting talent with opportunity.</p>
          </div>
          
          {user && (
            <>
              {user.role === 'freelancer' && (
                <div>
                  <h4 className="font-semibold mb-4 text-lg">For Freelancers</h4>
                  <ul className="space-y-2 text-gray-400">
                    <li><Link to="/projects" className="hover:text-white transition">Find Work</Link></li>
                    <li><Link to="/dashboard/freelancer" className="hover:text-white transition">My Proposals</Link></li>
                    <li><Link to="/contracts" className="hover:text-white transition">My Contracts</Link></li>
                  </ul>
                </div>
              )}
              
              {user.role === 'client' && (
                <div>
                  <h4 className="font-semibold mb-4 text-lg">For Clients</h4>
                  <ul className="space-y-2 text-gray-400">
                    <li><Link to="/projects/create" className="hover:text-white transition">Post Project</Link></li>
                    <li><Link to="/dashboard/client" className="hover:text-white transition">My Projects</Link></li>
                    <li><Link to="/contracts" className="hover:text-white transition">My Contracts</Link></li>
                  </ul>
                </div>
              )}
            </>
          )}
          
          <div>
            <h4 className="font-semibold mb-4 text-lg">Company</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/about" className="hover:text-white transition">About</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-lg">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/help" className="hover:text-white transition">Help Center</Link></li>
              <li><Link to="/terms" className="hover:text-white transition">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 TalentLink. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
