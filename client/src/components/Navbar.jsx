import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-blue-600">
        GigFlow
      </Link>

      <div className="space-x-4">
        <Link to="/" className="text-gray-700 hover:text-blue-600">
          Gigs
        </Link>
        <Link to="/post-gig" className="text-gray-700 hover:text-blue-600">
          Post Gig
        </Link>
        <Link to="/login" className="text-gray-700 hover:text-blue-600">
          Login
        </Link>
        <Link to="/register" className="text-gray-700 hover:text-blue-600">
          Register
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
