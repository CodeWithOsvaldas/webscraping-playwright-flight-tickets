# Web scrapping using playwright
Code from my Youtube video, [Web Scraping - find CHEAP flights (Playwright)](https://www.youtube.com/watch?v=CeQRbqOs0dk)

This script scrapes https://kiwi.com website for cheap weekend flights to any destination and saves the screenshots with the flight details.

### Install dependencies

```
npm install
```

### Modify index.js constants:
```
const DEPARTURE_CITY = 'Vilnius';
const DEPARTURE_CITY_URL_PARAM = 'vilnius-lithuania';
const DEFAULT_TIMEOUT = 5000;
const PRICE_THRESHOLD = 100;
const NUMBER_OF_WEEKENDS_TO_SEARCH = 10;
```

### Run the script

```
npm run start
```
