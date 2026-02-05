export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-black via-blue-950 to-purple-950 border-t border-white/10 mt-20">

      <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8 text-sm text-gray-300">

        {/* Brand */}
        <div>
          <h2 className="text-xl font-bold gradient-text mb-3">
            Ujjain AutoSeva 🚖🛕
          </h2>

          <p>
            Online Taxi & Darshan Booking Platform
          </p>

          <p className="mt-2">
            Safe • Fast • Reliable
          </p>
        </div>

        {/* Links */}
        <div>
          <h3 className="font-semibold mb-3 text-white">
            Quick Links
          </h3>

          <ul className="space-y-2">

            <li>Home</li>
            <li>Services</li>
            <li>Contact</li>
            <li>Dashboard</li>

          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-semibold mb-3 text-white">
            Contact
          </h3>

          <p>📞 +91 6263189202</p>
          <p>📧 support@ujjainautoseva.com</p>
          <p>📍 Ujjain, MP</p>
        </div>

      </div>

      <div className="text-center py-4 border-t border-white/10 text-gray-400 text-xs">

        © {new Date().getFullYear()} Ujjain AutoSeva | All Rights Reserved

      </div>

    </footer>
  );
}
