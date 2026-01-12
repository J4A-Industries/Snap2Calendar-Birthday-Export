import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo';
import { relayMessage, sendToBackground } from '@plasmohq/messaging';

/**
 * Execute the script on Snapchat web
 * Also sets up relays for MAIN world -> background communication
 */
export const config: PlasmoCSConfig = {
  matches: ['*://www.snapchat.com/web/*'],
  run_at: 'document_start',
  css: ['./style.css'],
};

// Relay for sending raw protobuf data from MAIN world to service worker
relayMessage({ name: 'processFriendData' });
