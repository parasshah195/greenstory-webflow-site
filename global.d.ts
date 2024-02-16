import type { Webflow } from '@finsweet/ts-utils';
import type { Alpine } from 'alpinejs';

declare global {
  interface Window {
    isLocal?: boolean;
    JS_SCRIPTS: Set<string> | undefined;
    Webflow: Webflow;

    IS_DEBUG_MODE: boolean;
    setDebugMode(mode: boolean): void;
    /**
     * A wrapper function to directly console log when debug mode is active
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    DEBUG: (...args: any[]) => void;
    Alpine: Alpine;
  }

  // Extend `querySelector` and `querySelectorAll` function to stop the nagging of converting `Element` to `HTMLElement` all the time
  interface ParentNode {
    querySelector<E extends HTMLElement = HTMLElement>(selectors: string): E | null;
    querySelectorAll<E extends HTMLElement = HTMLElement>(selectors: string): NodeListOf<E>;
  }
}

export {};
