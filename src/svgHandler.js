const config = require('../config'),
    puppeteer = require('puppeteer'),
    getChartOptions = require('./charts');

async function process({reqid, guid, exportSettings, chartSettings}) {
    let browser;
    try {
        console.log(` ## ${reqid} открывает новый броузер`);
        browser = await puppeteer.launch({headless: config.headless});
        let page = await browser.newPage();
        await page.goto(config.template);
        page.on('pageerror', msg => {
            throw msg
        });
        page.on('error', msg => {
            throw msg
        });
        let results = [], svg;
        console.log(`  * ${reqid} шебуршит SVG`);
        for (let chartSetting of chartSettings) {
            let {id, options} = chartSetting;
            let chartOptions = getChartOptions(options, exportSettings);
            try {
                await page.waitForSelector('#placeholder');
                svg = await page.evaluate(evaluateHandler, chartOptions);
            }
            catch (e) {
                console.log(`=== Ошибка. ${reqid} не смог сделать SVG ${guid}`);
            }
            results.push({id, data: svg});
        }
        return results;
    }
    catch (e) {
        console.log(`=== Ошибка. ${reqid} не смог завершить processSvg ${guid}`);
        throw e
    }
    finally {
        await browser.close();
        console.log(` ## ${reqid} закрыл броузер`);
    }
}

function evaluateHandler(options) {
    Highcharts.setOptions({
        lang: {
            numericSymbols: null,
            decimalPoint: ','
        }
    });
    Highcharts.chart('placeholder', options);
    return document.getElementsByClassName('highcharts-container')[0].innerHTML;
}

module.exports = process;