import React from "react";
import { FaHeart } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-slate-800 text-white fixed bottom-0 w-full py-3 z-30 border-t border-slate-700">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-5 px-4">
        {/* Logo */}
        <div className="text-lg sm:text-xl font-bold">
          <span className="text-green-500">&lt;</span>
          <span>Pass</span>
          <span className="text-green-500">OP/&gt;</span>
        </div>

        {/* Creator Attribution */}
        <div className="flex items-center gap-2 text-sm sm:text-base">
          <span>Created with</span>
          <FaHeart 
            className="text-red-500 w-4 h-4 animate-pulse mx-1" 
            aria-label="love"
            role="img"
          />
          <span>by <span className="font-semibold text-green-400">Ashu</span></span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
