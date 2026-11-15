import { useEffect } from 'react';

/**
 * Scroll reveal for the Home sections (Interactive Story, Cross-Border Impact,
 * Wildlife Profiles, Take Action).
 *
 * Elements move in EVERY time they scroll into view — scrolling down or back
 * up — for as long as the page is open. No reload needed.
 *
 *  - header text (eyebrow, title, intro) rises up one line after another
 *  - each big block of a section (panels, maps, charts) slides in,
 *    alternating from the left and from the right
 *  - the items of grids and lists (cards, chips, rows) zoom in with a stagger
 *
 * Once an element has completely left the screen it quietly resets, so it
 * plays again the next time it comes into view.
 */
const ROOT = ':scope > div:not([aria-hidden="true"])';
const HEADER_TEXT = `${ROOT} > header :is(p, h1, h2, h3)`;
const BLOCKS = `${ROOT} > :not(header):not(style):not(script)`;
const ITEMS = '.grid > *, ol > li, ul > li';
const SHOW_AT = 0.1; // share of the element that must be visible to play

export default function useScrollReveal(sectionIds) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ target, isIntersecting, intersectionRatio }) => {
          if (isIntersecting && intersectionRatio >= SHOW_AT) {
            target.classList.add('reveal-in');
          } else if (!isIntersecting) {
            // fully off screen: reset so it animates again on the way back
            target.classList.remove('reveal-in');
          }
        });
      },
      { threshold: [0, SHOW_AT] }
    );

    const prepare = (el, kind, delay) => {
      if (el.closest('[aria-hidden="true"]')) return; // skip decorative layers
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal');
        el.dataset.rv = kind;
        el.style.setProperty('--rd', `${delay}ms`);
      }
      io.observe(el);
    };

    const scan = () => {
      sectionIds.forEach((id) => {
        const section = document.getElementById(id);
        if (!section) return;

        section.querySelectorAll(HEADER_TEXT).forEach((el, i) => prepare(el, 'up', Math.min(i, 5) * 110));

        section.querySelectorAll(BLOCKS).forEach((el, i) => prepare(el, i % 2 === 0 ? 'left' : 'right', 0));

        section.querySelectorAll(ITEMS).forEach((el) => {
          if (el.classList.contains('reveal')) return;
          const i = Array.prototype.indexOf.call(el.parentElement.children, el);
          prepare(el, 'zoom', 120 + Math.min(i, 8) * 90);
        });
      });
    };

    // Wait a tick so the sections have rendered their content
    const timer = setTimeout(scan, 50);

    // Pick up content that appears later (data loading, "See all", story pages)
    let moTimer;
    const mo = new MutationObserver(() => {
      clearTimeout(moTimer);
      moTimer = setTimeout(scan, 120);
    });
    sectionIds.forEach((id) => {
      const section = document.getElementById(id);
      if (section) mo.observe(section, { childList: true, subtree: true });
    });

    return () => {
      clearTimeout(timer);
      clearTimeout(moTimer);
      mo.disconnect();
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
