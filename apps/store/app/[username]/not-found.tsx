import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-luxury-black flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="text-luxury-gold text-8xl mb-6">404</div>
        <h1 className="font-serif text-3xl font-bold text-white mb-4">
          Store Not Found
        </h1>
        <p className="text-gray-400 mb-8">
          The store you're looking for doesn't exist or has been deactivated.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-luxury-gold text-luxury-black font-semibold px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all"
        >
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
