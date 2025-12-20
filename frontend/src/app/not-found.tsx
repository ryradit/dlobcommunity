'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Image
            src="/dlob.png"
            alt="DLOB"
            width={80}
            height={80}
            className="rounded-full object-cover"
            priority
          />
        </div>

        {/* 404 Display */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-blue-600 mb-4">404</h1>
          <div className="w-24 h-1 bg-blue-600 mx-auto mb-6"></div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Oops! Page Not Found
          </h2>
          <p className="text-gray-600 mb-2">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <p className="text-gray-600">
            Don't worry, even champions miss their shots sometimes! 🏸
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors group"
          >
            <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            Back to Home
          </Link>
          
          <Link
            href="/about"
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors group"
          >
            <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            Explore DLOB
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Popular pages:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/about" className="text-blue-600 hover:text-blue-700">
              About Us
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/contact" className="text-blue-600 hover:text-blue-700">
              Contact
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/gallery" className="text-blue-600 hover:text-blue-700">
              Gallery
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/hall-of-fame" className="text-blue-600 hover:text-blue-700">
              Hall of Fame
            </Link>
          </div>
        </div>

        {/* Fun Animation */}
        <div className="mt-8">
          <div className="inline-block animate-bounce">
            <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}