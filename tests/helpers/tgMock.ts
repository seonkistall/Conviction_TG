/**
 * v2.28.2 — Telegram WebApp mock for Playwright e2e.
 *
 * Conviction's TG-specific code paths are gated by `isInTelegram()`
 * which checks `window.Telegram?.WebApp?.initData.length > 0`. To
 * exercise those paths in CI we inject a mock SDK before any page
 * script runs (`page.addInitScript`).
 *
 * The mock satisfies the runtime shape used by lib/tgWebApp.ts and
 * lib/tgMainButton.tsx — ready/expand/MainButton/HapticFeedback/
 * BackButton/initData/initDataUnsafe/themeParams. It records all
 * MainButton state changes on `window.__cv_mainBtnLog` so a test
 * can assert "MainButton said `Buy YES ¢41` when the market loaded".
 */

import type { Page } from '@playwright/test';

export interface TgMockOptions {
  /**
   * ISO 639-1 language code reported via initDataUnsafe.user.language_code.
   * Drives F-06 region routing assertions.
   */
  languageCode?: string;
  /**
   * Deeplink payload — `start_param` on initDataUnsafe.
   * Used to test market_<slug> / propose_<q> / feed routing.
   */
  startParam?: string;
  /** Override TG version reported. Default '7.7'. */
  version?: string;
  /** Override TG platform. Default 'tdesktop'. */
  platform?: string;
}

/**
 * Inject a minimal TG WebApp shim BEFORE first paint. Must be
 * called before page.goto() — uses Playwright's addInitScript so
 * the global lands before any Conviction script can read it.
 */
export async function installTgMock(page: Page, opts: TgMockOptions = {}) {
  const { languageCode = 'en', startParam = '', version = '7.7', platform = 'tdesktop' } = opts;
  await page.addInitScript(
    ({ languageCode, startParam, version, platform }) => {
      // initData must be non-empty to make isInTelegram() return true.
      // Real TG signs this; tests don't verify the signature.
      const initData = 'mock_signed_payload_' + Date.now();
      type Cb = () => void;
      const mainBtnLog: Array<Record<string, unknown>> = [];
      const hapticLog: Array<{ kind: string; arg: string }> = [];
      const navLog: Array<string> = [];
      // expose for assertions
      (window as unknown as { __cv_mainBtnLog: typeof mainBtnLog }).__cv_mainBtnLog = mainBtnLog;
      (window as unknown as { __cv_hapticLog:  typeof hapticLog  }).__cv_hapticLog  = hapticLog;
      (window as unknown as { __cv_navLog:     typeof navLog     }).__cv_navLog     = navLog;

      let mainClick: Cb | null = null;
      let backClick: Cb | null = null;
      const mainState = {
        text: '',
        color: '#000000',
        textColor: '#FFFFFF',
        isVisible: false,
        isActive: true,
        isProgressVisible: false,
      };

      window.Telegram = {
        WebApp: {
          ready() { /* no-op */ },
          expand() { /* no-op */ },
          close() { /* no-op */ },
          isExpanded: true,
          disableVerticalSwipes() { /* no-op */ },
          themeParams: {
            bg_color: '#05060A',
            text_color: '#F4F2EE',
            button_color: '#C7F34A',
            button_text_color: '#05060A',
          },
          colorScheme: 'dark',
          viewportHeight: 800,
          viewportStableHeight: 800,
          initData,
          initDataUnsafe: {
            query_id: 'mock_query',
            user: {
              id: 99999,
              first_name: 'Test',
              language_code: languageCode,
              is_premium: false,
            },
            auth_date: Math.floor(Date.now() / 1000),
            hash: 'mock_hash',
            start_param: startParam || undefined,
          },
          BackButton: {
            isVisible: false,
            show() { this.isVisible = true; navLog.push('back:show'); },
            hide() { this.isVisible = false; navLog.push('back:hide'); },
            onClick(cb: Cb) { backClick = cb; },
            offClick() { backClick = null; },
          },
          MainButton: {
            get text() { return mainState.text; },
            set text(v) { mainState.text = v; mainBtnLog.push({ ...mainState }); },
            get color() { return mainState.color; },
            set color(v) { mainState.color = v; },
            get textColor() { return mainState.textColor; },
            set textColor(v) { mainState.textColor = v; },
            get isVisible() { return mainState.isVisible; },
            get isActive() { return mainState.isActive; },
            get isProgressVisible() { return mainState.isProgressVisible; },
            setText(v: string) { mainState.text = v; mainBtnLog.push({ ...mainState }); },
            setParams(p: Record<string, unknown>) {
              if (typeof p.text === 'string') mainState.text = p.text;
              if (typeof p.color === 'string') mainState.color = p.color;
              if (typeof p.text_color === 'string') mainState.textColor = p.text_color;
              if (typeof p.is_active === 'boolean') mainState.isActive = p.is_active;
              if (typeof p.is_visible === 'boolean') mainState.isVisible = p.is_visible;
              mainBtnLog.push({ ...mainState });
            },
            onClick(cb: Cb) { mainClick = cb; },
            offClick() { mainClick = null; },
            show() { mainState.isVisible = true; mainBtnLog.push({ ...mainState }); },
            hide() { mainState.isVisible = false; mainBtnLog.push({ ...mainState }); },
            enable() { mainState.isActive = true; mainBtnLog.push({ ...mainState }); },
            disable() { mainState.isActive = false; mainBtnLog.push({ ...mainState }); },
            showProgress() { mainState.isProgressVisible = true; mainBtnLog.push({ ...mainState }); },
            hideProgress() { mainState.isProgressVisible = false; mainBtnLog.push({ ...mainState }); },
          },
          HapticFeedback: {
            impactOccurred(style: string) { hapticLog.push({ kind: 'impact', arg: style }); },
            notificationOccurred(type: string) { hapticLog.push({ kind: 'notify', arg: type }); },
            selectionChanged() { hapticLog.push({ kind: 'select', arg: '' }); },
          },
          setHeaderColor() { /* no-op */ },
          setBackgroundColor() { /* no-op */ },
          openTelegramLink(url: string) { navLog.push('tg:' + url); },
          openLink(url: string) { navLog.push('ext:' + url); },
          version,
          platform,
        },
      };

      // Helper API for tests to fire the buttons synthetically.
      (window as unknown as { __cv_clickMain: () => void }).__cv_clickMain = () => mainClick?.();
      (window as unknown as { __cv_clickBack: () => void }).__cv_clickBack = () => backClick?.();
    },
    { languageCode, startParam, version, platform }
  );
}
