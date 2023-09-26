/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useEffect } from 'react';
import { AnalyticsEvent } from '@/misc/GA';

const IndexPopup = () => {
  useEffect(() => {
    AnalyticsEvent([
      {
        name: 'icon_click',
      },
    ]);
    chrome.tabs.create({ url: chrome.runtime.getURL('tabs/main.html') });
  }, []);

  return (<></>);
};

export default IndexPopup;
