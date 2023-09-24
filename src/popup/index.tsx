/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useState, useEffect } from 'react';
import ukraineFlag from 'svg-country-flags/svg/ua.svg';
import '@/popup/style.css';
import { useStorage } from '@plasmohq/storage/hook';
import logo from '~assets/LighterFuel512.png';
import { openTab } from '@/misc/utils';
import 'https://www.googletagmanager.com/gtag/js?id=$PLASMO_PUBLIC_GTAG_ID';

enum menuOptions {
  settings,
  info,
}

const IndexPopup = () => {
  const [data, setData] = useState('');
  const [menuTab, setMenuTab] = useState<menuOptions>(menuOptions.settings);

  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments) // eslint-disable-line
    };
    window.gtag('config', process.env.PLASMO_PUBLIC_GTAG_ID, {
      page_path: '/popup',
    });
  }, []);

  return (
    <div className="App text-center w-[280px] font['Roboto', sans-serif] text-2xl font-light bg-slate-900 text-white p-5 select-none gap-2 flex flex-col">
      <h1>hi</h1>
    </div>
  );
};

export default IndexPopup;
