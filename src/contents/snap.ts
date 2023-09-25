import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo';
// import styleText from 'data-text:~src/contents/style.css';

/**
 * For some reason, injecting into the MAIN world on https://web.snapchat.com/ doesn't work.
 * TODO: Figure out why and use content scripts instead of script injection.
 */
export const config: PlasmoCSConfig = {
  matches: ['*://web.snapchat.com/*'],
  run_at: 'document_idle',
  css: ['./style.css'],
  world: 'MAIN',
};

console.log('Hi i am an injected script!');