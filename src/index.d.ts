declare namespace NodeJS {
  interface ProcessEnv {
    PLASMO_PUBLIC_GTAG_ID?: string
  }
}

interface Window {
  dataLayer: Array;
  gtag: (a: string, b: any, c?: any) => void;
  addToCalendarModal: any;
  addCalendarToGoogleModal: any;
  addCalendarToOutlookModal: any;
  addCalendarToIcloudModal: any;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png';
declare module '*.jpg';
