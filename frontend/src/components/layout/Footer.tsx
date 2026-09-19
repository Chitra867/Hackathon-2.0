import React from 'react';
import { GiHeartPlus } from 'react-icons/gi';

export const Footer: React.FC = () => (
  <footer className="mt-auto border-t border-gray-100 bg-white">
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-2">
          <GiHeartPlus
            className="text-xl text-primary-700"
            aria-hidden="true"
          />
          <span className="font-semibold text-gray-800">
            UpacharKhoj Nepal
          </span>
        </div>

        <p className="text-center text-xs text-gray-500 md:text-right">
          © {new Date().getFullYear()} UpacharKhoj Nepal.
          <br />
          Healthcare availability and referral coordination platform.
        </p>
      </div>
    </div>
  </footer>
);
