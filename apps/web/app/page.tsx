import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-luxury-black">
      {/* Header */}
      <header className="border-b border-luxury-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-luxury-gold">MyLuxuryNetwork</h1>
            <nav className="flex items-center gap-6">
              <Link href="/explore" className="text-gray-300 hover:text-white transition-colors">
                Explore
              </Link>
              <Link href="/sell" className="text-gray-300 hover:text-white transition-colors">
                Sell
              </Link>
              <Link
                href="/login"
                className="bg-luxury-gold hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Sign In
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            The Premier <span className="text-luxury-gold">Luxury</span> Marketplace
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Buy and sell authenticated luxury goods. Watches, jewelry, vehicles, real estate, and more.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/explore"
              className="bg-luxury-gold hover:bg-yellow-600 text-black font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Start Exploring
            </Link>
            <Link
              href="/sell"
              className="border border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-black font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Start Selling
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-luxury-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-white mb-10 text-center">Browse Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "Watches", icon: "⌚" },
              { name: "Jewelry", icon: "💎" },
              { name: "Vehicles", icon: "🚗" },
              { name: "Real Estate", icon: "🏠" },
              { name: "Art", icon: "🎨" },
              { name: "Fashion", icon: "👜" },
            ].map((category) => (
              <Link
                key={category.name}
                href={`/category/${category.name.toLowerCase().replace(" ", "-")}`}
                className="bg-luxury-gray hover:bg-luxury-gold/20 border border-luxury-gray hover:border-luxury-gold rounded-xl p-6 text-center transition-all group"
              >
                <span className="text-4xl block mb-3">{category.icon}</span>
                <span className="text-white group-hover:text-luxury-gold transition-colors">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-luxury-dark border border-luxury-gray rounded-xl p-8">
              <div className="w-12 h-12 bg-luxury-gold/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Verified Authentic</h4>
              <p className="text-gray-400">Every item is authenticated by experts before listing.</p>
            </div>
            <div className="bg-luxury-dark border border-luxury-gray rounded-xl p-8">
              <div className="w-12 h-12 bg-luxury-gold/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Secure Transactions</h4>
              <p className="text-gray-400">Protected payments with escrow service for peace of mind.</p>
            </div>
            <div className="bg-luxury-dark border border-luxury-gray rounded-xl p-8">
              <div className="w-12 h-12 bg-luxury-gold/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Exclusive Network</h4>
              <p className="text-gray-400">Connect with verified collectors and luxury enthusiasts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-luxury-gray py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p className="text-gray-500">© 2024 MyLuxuryNetwork. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/about" className="text-gray-500 hover:text-gray-300 transition-colors">
                About
              </Link>
              <Link href="/terms" className="text-gray-500 hover:text-gray-300 transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-gray-500 hover:text-gray-300 transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
