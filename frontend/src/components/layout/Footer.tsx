import React from 'react';
import { Link } from 'react-router-dom';
import { GiHeartPlus } from 'react-icons/gi';

export const Footer: React.FC = () => (
  <footer className="border-t border-[#e8dfcf] bg-[#fffdf9]">
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* Main row */}
      <div className="flex flex-col items-center justify-between gap-3 py-4 sm:flex-row">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 text-[#172554] hover:text-[#07545e] transition-colors">
          <GiHeartPlus className="text-lg text-[#07545e]" aria-hidden="true" />
          <span className="text-sm font-semibold">UpacharKhoj Nepal</span>
        </Link>

        {/* Links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <Link to="/" className="text-xs text-[#64748b] hover:text-[#07545e] transition-colors">
            Find Hospital
          </Link>
          <Link to="/about" className="text-xs text-[#64748b] hover:text-[#07545e] transition-colors">
            About
          </Link>
          <Link to="/login" className="text-xs text-[#64748b] hover:text-[#07545e] transition-colors">
            Login
          </Link>
          <Link to="/register" className="text-xs text-[#64748b] hover:text-[#07545e] transition-colors">
            Register
          </Link>
        </nav>
      </div>

      {/* Copyright */}
      <div className="border-t border-[#ede8de] py-3 text-center text-xs text-[#94a3b8]">
        © {new Date().getFullYear()} UpacharKhoj Nepal — Healthcare availability &amp; referral coordination.
      </div>
    </div>
  </footer>
);
