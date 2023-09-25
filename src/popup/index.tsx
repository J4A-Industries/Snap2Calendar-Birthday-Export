/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useState, useEffect } from 'react';
import '@/popup/style.css';
import { useStorage } from '@plasmohq/storage/hook';
import logo from '~assets/LighterFuel512.png';
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
  }, []);

  return (
    <div className="App text-center w-[280px] font['Roboto', sans-serif] text-2xl font-light bg-slate-900 text-white p-5 select-none gap-2 flex flex-col">
      <a href={chrome.runtime.getURL('tabs/main.html')} target="_blank" rel="noreferrer">
        <div className="btn btn-primary text-white h-12 w-32 text-3xl">
          Open
        </div>
      </a>
      <div className="text-center w-full p-2 text-sm">
        <a href="https://j4a.uk/" target="_blank" rel="noreferrer" className="text-white underline">
          By J4a Industries
        </a>
      </div>
    </div>
  );
};

export default IndexPopup;
