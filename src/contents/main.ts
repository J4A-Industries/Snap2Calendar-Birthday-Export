import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo';
import { sendToBackground } from '@plasmohq/messaging';
// import styleText from 'data-text:~src/contents/style.css';

/**
 * Execute the script on the tinder website,
 * Running in 'main' world, which means it has access to the DOM
 */
export const config: PlasmoCSConfig = {
  matches: ['*://j4a.uk/*'],
  run_at: 'document_start',
  css: ['./style.css'],
};

/**
 * Executing styling on the site, letting me use tailwind

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement('style');
  style.textContent = styleText;
  return style;
};
*/

try {
  console.log('Hello from contentscript.ts');
  sendToBackground({ name: 'getImages' as never }).then((res) => {
    console.log(`Message from background: ${res}`);
  });
} catch (err) {
  console.error(err);
}
