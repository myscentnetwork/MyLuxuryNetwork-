import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-luxury-black flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-luxury-gold flex items-center justify-center">
            <span className="font-serif text-4xl font-bold text-luxury-black">
              ML
            </span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
          <span className="text-luxury-gold">MyLuxury</span> Network
        </h1>

        {/* Tagline */}
        <p className="text-gray-400 text-lg md:text-xl mb-8">
          Premium luxury marketplace connecting verified resellers with
          discerning customers worldwide.
        </p>

        {/* Divider */}
        <div className="luxury-divider w-48 mx-auto mb-8"></div>

        {/* Demo Store Link */}
        <div className="space-y-4">
          <p className="text-gray-500 text-sm uppercase tracking-wide mb-4">
            Visit our demo store
          </p>
          <Link
            href="/demostore"
            className="inline-flex items-center gap-2 bg-luxury-gold text-luxury-black font-semibold px-8 py-4 rounded-lg hover:bg-opacity-90 transition-all hover:shadow-lg hover:shadow-luxury-gold/20"
          >
            <span>Visit Demo Store</span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-6 mt-16 text-center">
          <div>
            <div className="text-luxury-gold text-2xl mb-2">✓</div>
            <h3 className="text-white font-medium text-sm">Authentic Only</h3>
          </div>
          <div>
            <div className="text-luxury-gold text-2xl mb-2">🛡️</div>
            <h3 className="text-white font-medium text-sm">Verified Sellers</h3>
          </div>
          <div>
            <div className="text-luxury-gold text-2xl mb-2">💎</div>
            <h3 className="text-white font-medium text-sm">Premium Quality</h3>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-luxury-gray/30">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} MyLuxury Network. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
