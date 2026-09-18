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




      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
        © 2026 UpacharKhoj Nepal. Healthcare availability and referral coordination platform.
      </div>
    </div>
  </footer>
);
