# Chrome Time Tracker Extension

A Chrome Extension to track time spent on:
- Reading posts
- Talking with someone
- Browsing profiles
- Applying for jobs
- Editing your own profile

## Features

- Tracks time only on the **active tab**
- Categorizes activity based on page URL
- Detects chat windows in the feed to record messaging time
- Logs browsing time in real time while a tab is focused
- Dynamic popup updates with an animated chart
- Allows reset of all data

## Installation

1. Clone this repo or download the ZIP.
2. Go to `chrome://extensions/`.
3. Enable **Developer Mode**.
4. Click **Load Unpacked** and select this folder.

## Project Structure

chrome-time-tracker/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── styles.css
└── README.md

markdown
Copy
Edit

## How it Works

- `content.js` runs on each page and determines the activity category, including detecting chat windows within the feed.
- `background.js` stores the activity time per category.
- `popup.html` shows the tracked time and allows resetting.

## Permissions

- `tabs`: to get the current active tab.
- `storage`: to store time logs.
- `activeTab`: for active tab focus handling.