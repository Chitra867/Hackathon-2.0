import React from 'react';
import { Link } from 'react-router-dom';
import { GiHeartPlus } from 'react-icons/gi';
import { FiAlertCircle } from 'react-icons/fi';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">

        {/* Main footer row */}
        <div className="flex flex-col items-center justify-between gap-5 lg:flex-row">

          {/* Brand */}
          <div className="flex items-center gap-2">
            <GiHeartPlus className="text-xl text-primary-700" />

            <span className="font-semibold text-gray-800">
              UpacharKhoj Nepal
            </span>
          </div>

          {/* Availability notice */}
          <div
            className="
              flex
              max-w-xl
              items-start
              gap-2
              rounded-lg
              border
              border-amber-200
              bg-amber-50
              px-4
              py-3
              text-sm
              text-amber-700
            "
          >
            <FiAlertCircle className="mt-0.5 flex-shrink-0" />

            <span>
              All availability data is hospital-reported.
              Always confirm with the receiving facility before patient transfer.
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-5 text-sm text-gray-600">
            <Link
              to="/"
              className="transition-colors hover:text-primary-700"
            >
              Home
            </Link>

            <Link
              to="/"
              className="transition-colors hover:text-primary-700"
            >
              Find Hospital
            </Link>

            <Link
              to="/about"
              className="transition-colors hover:text-primary-700"
            >
              About
            </Link>

            <Link
              to="/login"
              className="transition-colors hover:text-primary-700"
            >
              Sign In
            </Link>
          </nav>

        </div>

        {/* Copyright */}
        <div className="mt-5 border-t border-gray-100 pt-4 text-center text-xs text-gray-400">
          © 2026 UpacharKhoj Nepal. Healthcare availability and referral
          coordination platform.
        </div>

      </div>
    </footer>
  );
};