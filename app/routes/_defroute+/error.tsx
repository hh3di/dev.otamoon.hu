import config from 'config';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuTriangleAlert } from 'react-icons/lu';
import { Link, useSearchParams } from 'react-router';

export default function error() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const errorType = searchParams.get('type') || 'default';
  const retry_after = searchParams.get('retry_after') || null;
  const [time, setTime] = useState(0);
  useEffect(() => {
    if (retry_after && retry_after !== '0') {
      const retryAfter = parseInt(retry_after);
      setTime(retryAfter);
      const interval = setInterval(() => {
        setTime((prev) => {
          if (prev > 0) {
            return prev - 1;
          } else {
            clearInterval(interval);
            return 0;
          }
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [retry_after]);

  // Use translation system for error info
  const errorInfo = {
    title: t(`errors.${errorType}.title`),
    message: t(`errors.${errorType}.message`),
    suggestion: t(`errors.${errorType}.suggestion`, { retry_after: time }),
    redirectPath: t(`errors.${errorType}.redirectPath`, { API_HOST: config.API_HOST }),
    buttonText: t(`errors.${errorType}.buttonText`),
  };

  return (
    <section className="relative flex flex-col justify-center min-h-screen py-6 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="w-full flex flex-col items-center text-center relative z-10 space-y-4 sm:space-y-5">
        {/* Error Icon with enhanced styling */}
        <div className="relative group">
          <div className="absolute inset-0 bg-linear-to-r from-rose-400/20 to-red-400/20 rounded-full blur-xl group-hover:from-rose-400/30 group-hover:to-red-400/30 transition-all duration-500"></div>
          <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-linear-to-br from-rose-500/20 to-red-500/20 backdrop-blur-sm border border-rose-500/30 transition-all duration-500 group-hover:scale-110">
            <LuTriangleAlert className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-rose-400 transition-transform duration-500 group-hover:scale-110" />
          </div>
        </div>

        {/* Error Title */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-none text-white uppercase tracking-tight">
            {errorInfo.title}
          </h1>
          <div className="w-12 sm:w-16 md:w-20 lg:w-24 h-1 bg-linear-to-r from-rose-400 via-red-300 to-rose-500 mx-auto rounded-full"></div>
        </div>

        {/* Error Message with enhanced styling */}
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-transparent bg-linear-to-r from-rose-200 via-red-200 to-rose-300 bg-clip-text font-bold max-w-2xl mx-auto leading-relaxed">
          {errorInfo.message}
        </p>

        {/* Error Suggestion */}
        <p className="text-sm sm:text-base md:text-lg text-rose-200/80 max-w-xl sm:max-w-2xl mx-auto leading-relaxed font-light">
          {errorInfo.suggestion}
        </p>

        {/* Action Buttons with enhanced styling */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4 sm:pt-6">
          {/* Primary Action Button */}
          {time && time !== 0 ? (
            <span className="group relative overflow-hidden cursor-not-allowed bg-rose-600/80 hover:bg-rose-500/80 px-6 py-3 rounded-lg text-sm sm:text-base md:text-lg font-bold transition-all duration-500 hover:shadow-xl hover:shadow-rose-500/30 flex items-center justify-center gap-3">
              <div className="absolute inset-0 bg-white/20 translate-x-[-104%] group-hover:translate-x-[104%] transition-transform duration-700 skew-x-12"></div>
              <span className="relative z-10">{errorInfo.buttonText}</span>
            </span>
          ) : (
            <Link
              to={errorInfo.redirectPath}
              className="group relative overflow-hidden bg-rose-600/80 hover:bg-rose-500/80 px-6 py-3 rounded-lg text-sm sm:text-base md:text-lg font-bold transition-all duration-500 hover:shadow-xl hover:shadow-rose-500/30 flex items-center justify-center gap-3"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-104%] group-hover:translate-x-[104%] transition-transform duration-700 skew-x-12"></div>
              <span className="relative z-10">{errorInfo.buttonText}</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
