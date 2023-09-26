/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useEffect } from 'react';
import 'https://www.googletagmanager.com/gtag/js?id=$PLASMO_PUBLIC_GTAG_ID';

const IndexPopup = () => {
  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments) // eslint-disable-line
    };
    window.gtag('config', process.env.PLASMO_PUBLIC_GTAG_ID, {
      page_path: '/popup',
    });
    chrome.tabs.create({ url: chrome.runtime.getURL('tabs/main.html') });
  }, []);

  return (<></>);
};

export default IndexPopup;
