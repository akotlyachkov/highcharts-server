let fs = require('fs'),
    path = require('path'),
    root = require('../root'),
    progressFolder = path.join(root, '/progress');

function log(reqid, body) {
    let filePath = path.join(progressFolder, `/${reqid}.json`);
    fs.writeFileSync(filePath, JSON.stringify(body, null, '  '))
}

module.exports = log;