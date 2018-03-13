const express = require('express'),
    app = express(),
    path = require('path'),
    fs = require('fs'),
    uuid = require('node-uuid'),
    config = require('./config'),
    cors = require('cors'),
    http = require('http'),
    bodyParser = require('body-parser'),
    server = http.createServer(app),
    puppeteer = require('puppeteer'),
    os = require('os'),
    Queue = require('promise-queue'),
    getChartOptions = require('./src/charts'),
    processCount = config.сoncurrent || os.cpus().length,
    maxQueue = config.maxQueue || Infinity;

let queueManagerBrowser = new Queue(1, maxQueue);
let queueManager = new Queue(processCount, maxQueue);
let browser;

app.use(cors());
app.use(bodyParser.json({limit: '4096kb'}));
app.use(bodyParser.urlencoded({extended: false}));

app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/placeholder', (req, res) => res.sendFile('index.html', {root: __dirname}));
app.post('/svg', function (req, res, next) {
    let body = req.body;
    if(!body.uid) body.uid = getRandomInt(10,99);
    let uid = body.uid ;
    let time = new Date().toISOString().
    replace(/T/, ' ').
    replace(/\..+/, '')  ;

    console.log(`### ${uid} старт запроса ${time}`);
    logRequestData(uid, body);
    queueManagerBrowser.add(() => {
        return getBrowser(uid)
    })
        .then(() => {
            return queueManager.add(() => processSvg(body))
                .then(result => {
                    console.log(`### ${uid} конец запроса`);
                    res.send(result)
                })
                .catch(next);
        })
        .catch(next);
});

app.use(function (err, req, res, next) {
    console.log('=== Обработчик ошибки в еxpress.js');
    console.log('----------------------------------');
    console.log(err);
    res.status(500).send(err);
});

server.listen(config.port, function () {
    init().then(() => {
        //browser = newBrowser;
        console.log(`Highcharts export server запущен http://localhost:${config.port}`);
    });
});

async function startBrowser() {
    try {
        console.log(' #= старт броузера');
        browser = await puppeteer.launch({headless: config.headless});
    }
    catch (e) {
        console.log("=== Ошибка. Не смогли запустить броузер");
        throw e;
    }
}

async function testBrowser(uid) {
    try {
        console.log(' #= тест броузера');
        let useragent = await browser.userAgent();
        return true;
    }
    catch (e) {
        console.log(` ## ${uid} не нашел броузер. Попробуем запустить`);
        return false;
    }
}

async function init(uid) {
    try {
        await startBrowser(uid);
        let currentPages = await browser.pages();

        for (let i = 0; i < processCount - currentPages.length; i++) {
            await createTab(uid);
        }
    }
    catch (e) {
        console.log("=== Ошибка инициализации SVG сервера");
        process.exit(1)
    }
}

async function createTab(uid) {
    try {
        console.log(` #= создан таб`);
        return await browser.newPage();
    }
    catch (e) {
        console.log(`=== Ошибка. ${uid} не смог открыть таб`);
        throw e;
    }
}

async function getFreePage(uid) {
    try {
        let currentPages = await browser.pages();
        console.log(` ## ${uid} видит ${currentPages.length} открытых таба. Очередь думает, что заняты [${queueManager.getPendingLength()}] слота `);
        let currentPage = currentPages.find(page => !page.active);
        if (!currentPage) {
            console.log(` ## ${uid} НЕ нашел себе свободный таб и решил открыть новый`);
            currentPage = await createTab();
        }
        currentPage.active = true;
        await currentPage.goto(config.template);
        console.log(` ## ${uid} нашел таки себе свободный таб`);
        return currentPage;
    }
    catch (e) {
        console.log(`=== Ошибка. ${uid} не смог занять таб`);
        throw e;
    }

}

async function processSvg({uid, exportSettings, chartSettings}) {
    try {
        let page = await getFreePage(uid);
        page.on('pageerror', msg => {throw msg});
        page.on('error', msg => {throw msg});
        let results = [], svg;
        console.log(`  * ${uid} шебуршит SVG`);
        for (let chartSetting of chartSettings) {
            let {id, options} = chartSetting;
            let chartOptions = getChartOptions(options, exportSettings);
            try {
                await page.waitForSelector('#placeholder');
                svg = await page.evaluate(evaluateHandler, chartOptions);
            }
            catch (e) {
                console.log(`=== Ошибка. ${uid} не смог сделать SVG`);
                throw e
            }
            results.push({id, data: svg});
        }
        page.active = false;
        console.log(` ## ${uid} смог SVG и освободил таб`);
        return results;
    }
    catch (e) {
        console.log(`=== Ошибка. ${uid} не смог сделать SVG`);
        throw e
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

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}



async function getBrowser(uid) {
    try {
        let browserExist = await testBrowser(uid);
        if (!browserExist)
            await init();
        return true;
    }
    catch (e) {
        console.log(`=== Ошибка. Не смогли инициализировать броузер для ${uid}`);
        throw e;
    }
}


function logRequestData(uid, body) {
    let filePath = path.join(__dirname, `/progress/${uid}_${uuid.v4()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(body, null, '  '))
}