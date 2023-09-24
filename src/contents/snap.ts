import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo';
// import styleText from 'data-text:~src/contents/style.css';

/**
 * Execute the script on the tinder website,
 * Running in 'main' world, which means it has access to the DOM
 */
export const config: PlasmoCSConfig = {
  matches: ['*://web.snapchat.com/*'],
  run_at: 'document_idle',
  css: ['./style.css'],
  world: 'MAIN',
};

window.document.body.style.backgroundColor = 'red';
