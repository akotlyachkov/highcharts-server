const express = require('express'),
    app = express(),
    path = require('path'),
    config = require('./config'),
    cors = require('cors'),
    http = require('http'),
    bodyParser = require('body-parser'),
    server = http.createServer(app),
    os = require('os'),
    Queue = require('promise-queue'),
    testHandler = require("./src/testHandler"),
    svgHandler = require("./src/svgHandler"),
    logRequestData = require("./src/log"),
    processCount = config.concurrent || os.cpus().length,
    maxQueue = config.maxQueue || Infinity;

let queueManager = new Queue(processCount, maxQueue);

app.use(cors());
app.use(bodyParser.json({limit: '4096kb'}));
app.use(bodyParser.urlencoded({extended: false}));

app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/placeholder', (req, res) => res.sendFile('index.html', {root: __dirname}));
app.use('/svg', (req, res, next) => {
    let body = req.body;
    let time = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    console.log(`### ${body.reqid} старт запроса ${time}`);
    logRequestData(body.reqid, body);
    queueManager.add(() => svgHandler(body))
        .then(result => {
            console.log(`### ${body.reqid} конец запроса`);
            res.send(result)
        })
        .catch(next);
});
app.use('/test', (req, res, next) => {
    let body = req.body;
    let time = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    console.log(`### ${body.reqid} старт запроса ${time}`);
    logRequestData(body.reqid, body);
    queueManager.add(() => testHandler(body))
        .then(result => {
            console.log(`### ${body.reqid} конец запроса`);
            res.send(result)
        })
        .catch(next);
});
app.use((err, req, res, next) => {
    console.log('----------------------------------');
    console.log(err);
    console.log('----------------------------------');
    res.status(500).send(err);
});

server.listen(config.port, function () {
    console.log(`Highcharts-export-server запущен http://localhost:${config.port}`);
});


