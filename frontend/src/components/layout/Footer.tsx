
import React from 'react';
import { GiHeartPlus } from 'react-icons/gi';
import { FiHeart } from 'react-icons/fi';

export const Footer: React.FC = () => (
  <footer className="mt-auto border-t border-[#e7e8df] bg-gradient-to-r from-[#f8faf7] via-white to-[#f2f8f5]">
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0e6068] shadow-sm">
            <GiHeartPlus className="text-2xl text-white" />
          </div>

          <div>
            <h3 className="text-lg font-bold tracking-tight text-[#173c40]">
              UpacharKhoj Nepal
            </h3>

            <p className="text-xs tracking-wide text-[#82938e]">
              Healthcare made easier.
            </p>
          </div>
        </div>

        {/* Healthcare message */}
        <div className="flex items-center gap-2 rounded-full border border-[#dcebe5] bg-[#eaf5f0] px-4 py-2">
          <FiHeart className="text-[#0e7775]" />

          <span className="text-xs font-medium text-[#497b6c]">
            Connecting you to better care
          </span>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-5 border-t border-[#e6ebe5] pt-4 text-center">
        <p className="text-xs text-[#8b9c96]">
          © {new Date().getFullYear()} UpacharKhoj Nepal
          <span className="mx-2 text-[#c5d2cb]">•</span>
          Made with care for Nepal
        </p>
      </div>
    </div>
  </footer>
);