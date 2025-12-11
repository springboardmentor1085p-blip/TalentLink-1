// frontend/src/components/layout/PageWrapper.jsx
import React, { useMemo } from 'react';

/**
 * Reusable layout wrapper that gives pages a consistent
 * light/dark background and card style, similar to AccountSettings.
 *
 * Props:
 * - title?: string
 * - subtitle?: string
 * - children: React.ReactNode
 * - maxWidth?: string (e.g. "max-w-6xl")
 */
export default function PageWrapper({
  title,
  subtitle,
  children,
  maxWidth = 'max-w-6xl',
}) {
  // Read theme once from localStorage (no state needed here)
  const { isDark, pageBg, cardBg, subtleText } = useMemo(() => {
    const theme = localStorage.getItem('tl_theme') || 'light';
    const isDark = theme === 'dark';

    return {
      isDark,
      pageBg: isDark
        ? 'bg-slate-950 text-slate-100'
        : 'bg-gray-50 text-gray-900',
      cardBg: isDark
        ? 'bg-slate-900 border border-slate-700'
        : 'bg-white',
      subtleText: isDark ? 'text-slate-400' : 'text-gray-600',
    };
  }, []);

  return (
    <div className={`min-h-screen py-8 ${pageBg}`}>
      <div className={`container mx-auto px-4 ${maxWidth}`}>
        {title && (
          <>
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            {subtitle && (
              <p className={`mb-6 text-sm ${subtleText}`}>{subtitle}</p>
            )}
          </>
        )}

        {/* You decide how many cards / sections you render inside */}
        <div className={`space-y-6`}>
          {/*
            children should usually be card(s) that themselves use `cardBg`
            Example:
            <div className={`${cardBg} rounded-xl shadow p-6`}> ... </div>
          */}
          {React.Children.map(children, (child) => {
            // Just pass cardBg & subtleText down via props if child wants it
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                _tlCardBg: cardBg,
                _tlSubtleText: subtleText,
                _tlIsDark: isDark,
              });
            }
            return child;
          })}
        </div>
      </div>
    </div>
  );
}
