const fs = require('fs'),
    puppeteer = require('puppeteer'),
    getChartOptions = require('./charts');

async function process({reqid, exportSettings, chartSettings}) {
    try {
        console.log(` ## ${reqid} открывает новый броузер`);
        let browser = await puppeteer.launch({headless: false, devtools: false});
        let page = await browser.newPage();
        page.on('pageerror', msg => {
            throw msg
        });
        page.on('error', msg => {
            throw msg
        });

        let chartOptions = [];
        for (let chartSetting of chartSettings) {
            let {id, options} = chartSetting;
            chartOptions.push({id, options: getChartOptions(options, exportSettings)});
        }
        await page.setContent(render({reqid, chartOptions}));
        let highchartsCode = fs.readFileSync('./assets/highcharts.js', "utf8");
        let prettyCode = fs.readFileSync('./assets/pretty.js', "utf8");
        let resetCode = fs.readFileSync('./assets/style.css', "utf8");
        await page.addScriptTag({content: highchartsCode});
        await page.addScriptTag({content: prettyCode});
        await page.addStyleTag({content: resetCode});
        await page.setViewport({
            width: 0,
            height: 0,
        });
        console.log(`  * ${reqid} шебуршит графики`);
        await page.evaluate(evaluateHandler, chartOptions);
    }
    catch (e) {
        console.log(`=== Ошибка. ${reqid} не смог завершить processSvg`);
        throw e
    }
}

function render({reqid, chartOptions}) {
    let template = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Highcharts template</title>
        </head>
        <body>
        <h1>${reqid}</h1>
    `;

    chartOptions.forEach(chartOption => {
        template += `
            <div class="hc">
                <h3>Chart "${chartOption.id}"</h3>
                <pre class="prettyprint json-view">${JSON.stringify(chartOption.options, null, 4)}</pre>
                <div id="${chartOption.id}"></div>
            </div>
        `;
    });

    template += `</body></html>`;
    return template;
}

function evaluateHandler(chartOptions) {
    Highcharts.setOptions({
        lang: {
            numericSymbols: null,
            decimalPoint: ','
        }
    });
    chartOptions.forEach(chartOption => {
        Highcharts.chart(chartOption.id, chartOption.options);
    });
}

module.exports = process;