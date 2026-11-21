'use client';

import { useEffect } from 'react';

/** Owns the reversible scroll timeline and releases every listener on navigation. */
export function useScrollStory(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const root = document.getElementById('topic-scroll');
    if (!root) return;
    const find = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
    const menu = find('.ss-navlinks');
    const story = find('.ss-story'), inner = find('.ss-story-inner');
    const graphic = find('.ss-connection'), people = find('#ss-people'), create = find('#ss-create');
    const meetingButton = find<HTMLButtonElement>('.ss-meet-pill');
    const status = find('[data-match-status]');
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const controller = new AbortController();
    const { signal } = controller;
    const clamp = (n: number) => Math.max(0, Math.min(1, n));
    const between = (start: number, end: number, n: number) => clamp((n - start) / (end - start));
    let frame = 0, animations: Animation[] = [], programmaticUntil = 0;
    let locked: HTMLElement | null = null, lastWheel = -Infinity, lastDirection = 0, previousY = scrollY;
    let touchUntil = 0;
    const top = (el: HTMLElement) => el === root ? 0 : scrollY + el.getBoundingClientRect().top;
    const release = () => { locked = null; previousY = scrollY; delete root.dataset.scrollStop; };
    const prepare = () => { release(); programmaticUntil = performance.now() + 1800; };
    const go = (target: string) => {
      const el = target === 'top' ? root : find(`#ss-${target}`);
      if (!el) return;
      prepare();
      window.scrollTo({ top: top(el), behavior: media.matches ? 'instant' : 'smooth' });
    };
    const stop = (el: HTMLElement) => {
      locked = el; root.dataset.scrollStop = el.id;
      window.scrollTo({ top: top(el), behavior: 'instant' }); previousY = scrollY;
    };
    const crossing = (from: number, to: number) => {
      const direction = Math.sign(to - from);
      return [root, story, people, create].map(el => ({ el, y: top(el) }))
        .filter(s => direction > 0 ? s.y > from + 2 && s.y <= to : s.y < from - 2 && s.y >= to)
        .sort((a, b) => direction * (a.y - b.y))[0]?.el;
    };
    root.addEventListener('click', event => {
      const button = (event.target as Element).closest<HTMLElement>('[data-go]');
      if (button) { event.preventDefault(); go(button.dataset.go!); }
      if ((event.target as Element).closest('[data-replay]')) {
        prepare();
        window.scrollTo({ top: root.dataset.storyPinned === 'true' ? top(story) : Math.max(0, top(graphic) - innerHeight * .85), behavior: media.matches ? 'instant' : 'smooth' });
      }
    }, { signal });
    // Explicit actions and keyboard focus bypass gesture stops and reveal their content.
    root.addEventListener('submit', prepare, { capture: true, signal });
    root.addEventListener('focusin', () => { prepare(); schedule(); }, { signal });
    window.addEventListener('scrollend', () => { programmaticUntil = 0; }, { signal });
    window.addEventListener('wheel', event => {
      if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
      if (document.querySelector('dialog[open]') || (event.target as Element).closest('select,textarea,input,[contenteditable=true]')) return;
      const now = performance.now(), direction = Math.sign(event.deltaY);
      if (now - lastWheel > 220 || direction !== lastDirection) release();
      lastWheel = now; lastDirection = direction; touchUntil = 0;
      if (programmaticUntil > now) { programmaticUntil = 0; window.scrollTo({ top: scrollY, behavior: 'instant' }); previousY = scrollY; }
      if (locked) { event.preventDefault(); stop(locked); return; }
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
      const target = crossing(scrollY, scrollY + event.deltaY * unit);
      if (target) { event.preventDefault(); stop(target); }
    }, { passive: false, signal });
    window.addEventListener('touchstart', event => {
      if (event.touches.length !== 1 || document.querySelector('dialog[open]') || (event.target as Element).closest('select,textarea,input,[contenteditable=true]')) return;
      release(); touchUntil = Infinity; programmaticUntil = 0;
    }, { passive: true, signal });
    window.addEventListener('touchmove', event => { if (touchUntil && locked && event.cancelable) event.preventDefault(); }, { passive: false, signal });
    window.addEventListener('touchend', () => { if (touchUntil) touchUntil = performance.now() + 1600; }, { passive: true, signal });
    window.addEventListener('touchcancel', () => { touchUntil = 0; release(); }, { passive: true, signal });
    window.addEventListener('scroll', () => {
      const now = performance.now();
      if (now >= programmaticUntil && (now - lastWheel < 220 || now < touchUntil)) {
        if (locked) { if (Math.abs(scrollY - top(locked)) > 1) stop(locked); }
        else { const target = crossing(previousY, scrollY); if (target) stop(target); }
      }
      previousY = scrollY; schedule();
    }, { passive: true, signal });

    function update() {
      frame = 0;
      const enabled = !media.matches;
      root!.style.setProperty('--ss-menu-width', menu.getBoundingClientRect().width + 'px');
      graphic.style.setProperty('--ss-card-spread', (innerWidth <= 580 ? 0 : Math.max(0, Math.min(40, (graphic.clientWidth - 280) * .17))) + 'px');
      const extra = root!.dataset.transitionEnabled === 'true' && root!.dataset.storyPinned === 'false' && innerWidth > 1000 ? 80 : 0;
      const pinned = enabled && innerWidth > 1000 && inner.offsetHeight - extra <= innerHeight + 1;
      root!.dataset.storyPinned = String(pinned); root!.dataset.transitionEnabled = String(enabled);
      root!.style.setProperty('--ss-story-viewport', innerHeight + 'px');
      root!.style.setProperty('--ss-story-track-height', innerHeight * 3.25 + 'px');
      let progress = 1;
      if (enabled) {
        const sceneTop = graphic.getBoundingClientRect().top;
        progress = pinned ? clamp(-story.getBoundingClientRect().top / innerHeight) : clamp((Math.min(innerHeight * .85, sceneTop - story.getBoundingClientRect().top) - sceneTop) / Math.max(320, graphic.offsetHeight * .8));
        if (!graphic.classList.contains('ss-play')) {
          graphic.classList.add('ss-play'); animations = graphic.getAnimations({ subtree: true }); animations.forEach(a => a.pause());
        }
        animations.forEach(a => { a.currentTime = progress * 4800; });
      } else { graphic.classList.remove('ss-play'); animations = []; }
      graphic.dataset.progress = progress.toFixed(4);
      const sheet = enabled ? clamp((innerHeight - people.getBoundingClientRect().top) / innerHeight) : 1;
      const copyExit = between(0, .65, sheet), cardsExit = between(.35, 1, sheet);
      meetingButton.disabled = enabled && (progress < .73 || cardsExit > .85);
      story.style.setProperty('--ss-story-copy-alpha', String(enabled ? 1 - copyExit : 1));
      story.style.setProperty('--ss-story-copy-y', -copyExit * 55 + 'px');
      story.style.setProperty('--ss-story-details-alpha', String(enabled ? 1 - copyExit * .9 : 1));
      story.style.setProperty('--ss-story-cards-alpha', String(enabled ? 1 - cardsExit : 1));
      const final = enabled ? clamp((innerHeight - create.getBoundingClientRect().top) / innerHeight) : 1;
      root!.style.setProperty('--ss-final-background', `rgb(${255 - 12 * final} ${255 - 15 * final} ${255 - 7 * final})`);
      for (const [name, entry] of Object.entries({ bridge: enabled ? between(.04, .34, final) : 1, 'final-copy': enabled ? between(.22, .6, final) : 1, 'final-form': enabled ? between(.4, .85, final) : 1 })) {
        create.style.setProperty(`--ss-${name}-alpha`, String(entry)); create.style.setProperty(`--ss-${name}-y`, (1 - entry) * 24 + 'px');
      }
      people.style.setProperty('--ss-sheet-radius', enabled ? (innerWidth <= 580 ? 28 : 48) * (1 - sheet) + 'px' : '0px');
      for (const [name, entry] of Object.entries({ title: enabled ? between(.04, .32, sheet) : 1, filters: enabled ? between(.15, .42, sheet) : 1 })) {
        people.style.setProperty(`--ss-${name}-alpha`, String(entry)); people.style.setProperty(`--ss-${name}-y`, (1 - entry) * 34 + 'px');
      }
      people.querySelectorAll<HTMLElement>('.ss-person').forEach((card, index) => {
        // Keep every result reachable even when the API returns many participants.
        const offset = Math.min(index, 2) * .07;
        const entry = enabled ? between(.3 + offset, .57 + offset, sheet) : 1;
        card.style.setProperty('--ss-enter-alpha', String(entry * (enabled ? 1 - final * .4 : 1)));
        card.style.setProperty('--ss-enter-y', ((1 - entry) * 45 - (enabled ? final * 22 : 0)) + 'px');
      });
      const phase = progress < .36 ? 'interest' : progress < .74 ? 'match' : progress < 1 ? 'meeting' : 'done';
      if (graphic.dataset.phase !== phase) {
        graphic.dataset.phase = phase;
        status.textContent = { interest: 'Прокрутите вниз — карточки сблизятся', match: 'Нашлась общая тема — ИИ в аналитике', meeting: 'Теперь есть повод познакомиться', done: 'Есть общая тема. Можно предложить встречу.' }[phase];
      }
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    window.addEventListener('resize', () => { release(); lastWheel = -Infinity; touchUntil = 0; schedule(); }, { signal });
    media.addEventListener('change', schedule, { signal });
    const resize = new ResizeObserver(schedule);
    [menu, inner, people, create].forEach(el => resize.observe(el));
    root.querySelectorAll('.ss-reveal').forEach(el => el.classList.add('ss-visible'));
    schedule();
    return () => {
      controller.abort(); resize.disconnect(); cancelAnimationFrame(frame); animations.forEach(a => a.cancel());
    };
  }, [active]);
}
