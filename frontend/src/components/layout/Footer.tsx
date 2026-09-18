import React from 'react';
import { Link } from 'react-router-dom';
import { GiHeartPlus } from 'react-icons/gi';
import { FiAlertCircle } from 'react-icons/fi';

export const Footer: React.FC = () => (
  <footer className="bg-white border-t border-gray-100 mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <GiHeartPlus className="text-xl text-primary-700" />
          <span className="font-semibold text-gray-800">UpacharKhoj Nepal</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-md text-center">
          <FiAlertCircle className="flex-shrink-0" />
          <span>
            All availability data is hospital-reported. Always confirm with the receiving facility before patient transfer.
          </span>
        </div>

        <nav className="flex gap-4 text-sm text-gray-500">
          <Link to="/" className="hover:text-primary-700 transition-colors">Home</Link>
          <Link to="/search" className="hover:text-primary-700 transition-colors">Find Hospital</Link>
          <Link to="/login" className="hover:text-primary-700 transition-colors">Sign In</Link>
        </nav>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
        © 2026 UpacharKhoj Nepal. Healthcare availability and referral coordination platform.
      </div>
    </div>
  </footer>
);
