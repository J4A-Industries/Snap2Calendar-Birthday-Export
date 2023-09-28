# Snap2Calendar Birthday Export
![Chrome Web Store Downloads](https://img.shields.io/chrome-web-store/users/hejjegjbfaabkgaejceenfeeeocbocmk)
![Chrome Web Store Release](https://img.shields.io/chrome-web-store/v/hejjegjbfaabkgaejceenfeeeocbocmk)
![Chrome Web Store Rating](https://img.shields.io/chrome-web-store/stars/hejjegjbfaabkgaejceenfeeeocbocmk)

![Logo](https://raw.githubusercontent.com/Acorn221/Snap2Calendar-Birthday-Export/master/assets/icon128.png)

[Get It Here](https://chrome.google.com/webstore/detail/snap2calendar-birthday-ex/hejjegjbfaabkgaejceenfeeeocbocmk)

## What is this?

This extension allows you to export birthdays from your snapchat friends to your calendar, in ICAL format.
It works by intercepting the fetch requests on https://web.snapchat.com/ and extracting the friends list from the response,
then it lets you select which birthdays you want to export and finally it lets you download the ICAL file.

![Promo-image-1](https://raw.githubusercontent.com/Acorn221/Snap2Calendar-Birthday-Export/master/assets/promo1.png)

## Todo

- [ ] Get the user to select which calendar to export to at the start, then limit notification options based off of the calendar type
  - [ ] Google allows all the notifications, but requires a calendar file to be uploaded twice
  - [ ] Outlook only allows one, 1 day before
  - [ ] ICloud allows 2 whenever
