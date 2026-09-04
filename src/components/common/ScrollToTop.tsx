import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 *
 * Ensures that whenever a user navigates to a new page or refreshes the page,
 * the window scroll position is immediately reset to the top (0, 0).
 */
export const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Disable browser default scroll restoration so refreshing starts at top
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Scroll to the absolute top of the page
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [pathname, search]);

  return null;
};
