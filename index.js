import playwright from 'playwright';
import { addDays, nextFriday, format } from 'date-fns';

const DEPARTURE_CITY = 'Vilnius';
const DEPARTURE_CITY_URL_PARAM = 'vilnius-lithuania';
const DEFAULT_TIMEOUT = 5000;
const PRICE_THRESHOLD = 100;
const NUMBER_OF_WEEKENDS_TO_SEARCH = 10;

const CURRENCY_SYMBOL = '$';

const formatDate = (date) => format(date, 'yyyy-MM-dd');

const getUpcomingWeekends = (numberOfWeekends) => {
    const weekends = [];

    let currentDate = new Date();
    for (let i = 0; i < numberOfWeekends; i++) {
        currentDate = nextFriday(currentDate);
        const friday = formatDate(currentDate);
        const sunday = formatDate(addDays(currentDate, 2));
        weekends.push({ friday, sunday });
    }
    return weekends;
}

async function main() {
    const browser = await playwright.chromium.launch({
        headless: false,
    });

    const page = await browser.newPage();

    const upcomingWeekends = getUpcomingWeekends(NUMBER_OF_WEEKENDS_TO_SEARCH);

    let cookiesAccepted = false;
    for (const weekend of upcomingWeekends) {
        const { friday: from, sunday: to } = weekend;
        await page.goto(`https://www.kiwi.com/en/search/tiles/${DEPARTURE_CITY_URL_PARAM}/anywhere/${from}/${to}?sortAggregateBy=price`);
        await page.waitForTimeout(DEFAULT_TIMEOUT);

        if (!cookiesAccepted) {
            await page.locator('#cookies_accept').click();
            cookiesAccepted = true;
            await page.waitForTimeout(DEFAULT_TIMEOUT);

            // Set currency to USD
            await page.locator('[data-test=RegionalSettingsButton]').click();
            await page.waitForTimeout(DEFAULT_TIMEOUT);
            await page.selectOption('[data-test=CurrencySelect]', 'usd');
            await page.waitForTimeout(DEFAULT_TIMEOUT);
            await page.locator('text=Save & continue').click();
        }

        const cityCardLocator = page.locator('[data-test=PictureCard]');
        const cityCardsCount = await cityCardLocator.count();

        for (let i = 0; i < cityCardsCount; i++) {
            const currentCityCardLocator = cityCardLocator.nth(i);
            const textContent = await currentCityCardLocator.textContent();
            const price = Number(textContent.substring(textContent.indexOf(CURRENCY_SYMBOL) + 1));
            if (price < PRICE_THRESHOLD) {
                await currentCityCardLocator.click();
                await page.waitForTimeout(DEFAULT_TIMEOUT);

                await page.locator('text=Cheapest').click();
                await page.waitForTimeout(DEFAULT_TIMEOUT);

                const city = textContent.substring(textContent.indexOf(DEPARTURE_CITY) + DEPARTURE_CITY.length, textContent.indexOf('From'))
                    .replaceAll(' ', '-');
                const cheapestFlightCardLocator = page.locator('[data-test=ResultCardWrapper]').first();
                const actualPriceWithDollarSign = await cheapestFlightCardLocator.locator('[data-test=ResultCardPrice] > div:nth-child(1)').textContent();

                const actualPrice = Number(actualPriceWithDollarSign.replace(CURRENCY_SYMBOL, ''));
                if (actualPrice < PRICE_THRESHOLD) {
                    await cheapestFlightCardLocator.screenshot({ path: `${from} ${to}(${city})-${actualPrice}.png` });
                }

                await page.goto(`https://www.kiwi.com/en/search/tiles/${DEPARTURE_CITY_URL_PARAM}/anywhere/${from}/${to}?sortAggregateBy=price`);
                await page.waitForTimeout(DEFAULT_TIMEOUT);
            }
        }
    }

    await browser.close();
}

main();
