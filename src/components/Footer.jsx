import React, { useState } from 'react';

export default function Footer() {
  const [activeTab, setActiveTab] = useState(null);

  const toggleTab = (tab, e) => {
    e.preventDefault();
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  return (
    <footer className="p-4 space-y-4 text-xs w-full font-thin max-w-5xl mx-auto pad-safe-btm">
      <div className="flex gap-4 flex-col sm:flex-row">
        <a className="text-lg tracking-tight uppercase font-thin text-[#daa] mr-4 flex items-center" href="/">
          <img src="/favicon.svg" className="h-10 w-10 mr-2 inline-block" alt="Uncle Ming" />
          Uncle Ming
        </a>
        <div className="flex-1 text-justify">
          我們致力於推廣具有文化意義的傳統與習俗。我們的使命是通過教育計劃、文化活動和支持藝術家的方式，保護並傳播來自世界各地的重要文化遺產。
        </div>
        <div className="flex-1">
          We are committed to promoting culturally significant traditions and customs. Our mission is to preserve and communicate important cultural heritage from around the world through educational programs, cultural events and support for artists.
        </div>
      </div>

      <div className="text-2xs text-center uppercase tracking-widest">
        版權所有 Copyright 2026 ·{' '}
        <a href="mailto:ming@uncleming.com" className="hover:underline focus:underline" translate="no" lang="ja">
          @Ming
        </a>{' '}
        ·{' '}
        <a href="#terms" onClick={(e) => toggleTab('terms', e)} className="hover:underline focus:underline">
          Terms
        </a>{' '}
        ·{' '}
        <a href="#privacy" onClick={(e) => toggleTab('privacy', e)} className="hover:underline focus:underline">
          Privacy Policy
        </a>
      </div>

      {activeTab === 'privacy' && (
        <aside id="privacy" className="block mt-2">
          <h2 className="inline font-semibold">Privacy Policy: </h2>
          This website does not collect personally identifiable information except for already public information such as your IP address for the sole purpose of spam filtering and is cleared out on a weekly basis. Any other information including your interactions and selections will only be stored anonymously and collectively and will not be associated with your personal information and is used to provide the main functionality of this website.
        </aside>
      )}

      {activeTab === 'terms' && (
        <aside id="terms" className="block mt-2">
          <h2 className="inline font-semibold">Terms of Use: </h2>
          This website and its service is provided as-is. We make no warranties, expressed or implied, about the functionality or availability of the service. We shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from the use or inability to use the service. We reserve the right to modify these terms at any time.
        </aside>
      )}
    </footer>
  );
}
