import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetcher } from 'react-router';
import { LuGlobe, LuMenu, LuX } from 'react-icons/lu';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const fetcher = useFetcher();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  const toggleLanguage = () => {
    const newLanguage = i18n.language === 'en' ? 'hu' : 'en';

    // Azonnal váltunk a nyelvn a UX-ért
    i18n.changeLanguage(newLanguage);

    // Elküldjük a server-nek hogy mentse el cookie-ba
    fetcher.submit({ language: newLanguage }, { method: 'POST', action: '/action/changeLanguage' });
  };
  return (
    <>
      <header
        className={`sticky top-0 left-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-gray-800/80 backdrop-blur-sm shadow-lg shadow-slate-900/50' : ''}`}
      >
        <nav className="px-4 sm:px-16 lg:px-24">
          <div className="flex items-center justify-between h-16">
            <div className="shrink-0">
              <button onClick={() => scrollToSection('hero')} className="text-xl font-medium text-sky-500 hover:text-sky-400 transition-colors">
                Dani
              </button>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('about')} className="text-gray-300 hover:text-white transition-colors">
                {t(`nav.about`)}
              </button>
              <button onClick={() => scrollToSection('skills')} className="text-gray-300 hover:text-white transition-colors">
                {t(`nav.skills`)}
              </button>
              <button onClick={() => scrollToSection('projects')} className="text-gray-300 hover:text-white transition-colors">
                {t(`nav.projects`)}
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-gray-300 hover:text-white transition-colors">
                {t(`nav.contact`)}
              </button>
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-gray-300 hover:text-white hover:bg-slate-700 transition-all"
                aria-label="Toggle language"
              >
                <LuGlobe size={18} />
                <span className="text-sm font-medium uppercase">{i18n.language}</span>
              </button>
            </div>

            <div className="md:hidden flex items-center gap-3">
              <button
                onClick={toggleLanguage}
                className="p-2 rounded-lg bg-slate-800 text-gray-300 hover:text-white transition-colors"
                aria-label="Toggle language"
              >
                <LuGlobe size={20} />
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-300 hover:text-white transition-colors relative"
                aria-label="Toggle menu"
              >
                <LuX size={24} className={`${isMenuOpen ? 'rotate-0' : 'rotate-180 opacity-0'} absolute duration-200`} />
                <LuMenu size={24} className={`${isMenuOpen ? '-rotate-180 opacity-0' : 'rotate-0'} duration-200`} />
              </button>
            </div>
          </div>

          <div
            className={`${isMenuOpen ? 'opacity-100 pointer-events-auto scale-y-100' : 'opacity-0 pointer-events-none scale-y-0'} duration-200 origin-top md:hidden p-4 border-t border-gray-800 fixed top-16 left-0 right-0 bg-slate-800`}
          >
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => scrollToSection('about')}
                className="text-gray-300 hover:text-white p-2 rounded-md hover:bg-slate-700 transition-colors text-left"
              >
                {t(`nav.about`)}
              </button>
              <button
                onClick={() => scrollToSection('skills')}
                className="text-gray-300 hover:text-white p-2 rounded-md hover:bg-slate-700 transition-colors text-left"
              >
                {t(`nav.skills`)}
              </button>
              <button
                onClick={() => scrollToSection('projects')}
                className="text-gray-300 hover:text-white p-2 rounded-md hover:bg-slate-700 transition-colors text-left"
              >
                {t(`nav.projects`)}
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-gray-300 hover:text-white p-2 rounded-md hover:bg-slate-700 transition-colors text-left"
              >
                {t(`nav.contact`)}
              </button>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
