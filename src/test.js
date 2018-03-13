let fs = require('fs'),
    root = require('../root'),
    path = require('path'),
    axios = require('axios'),
    progressFolder = path.join(root, '/progress');



function call(url) {
    let data;
    let start = Date.now();
    if (process.argv && process.argv[2]) {
        let filename = process.argv[2];
        data = require(path.join(progressFolder, `/${filename}.json`));
        if (!data.reqid)
            data.reqid = filename;
    }
    else {
        console.log('нужно указать параметр - имя файла из /progress')
    }
    console.log(`${Date.now() - start}ms - ${data.reqid} - Отправлен`);
    axios.post(url, data)
        .then(response => {
            console.log(`${Date.now() - start}ms - ${data.reqid} - Ответил`);
        })
        .catch(error => {
            let filePath = path.join(root, `/progress/_err_${data.reqid}.txt`);
            fs.writeFileSync(filePath, error);
            console.log(`${Date.now() - start}ms - ${data.reqid} - Ошибка`);
        });
}

function run(url) {
    let count = 1;
    if (process.argv && process.argv[3]) {
        count = process.argv[3];
    }
    for (let i = 0; i < count; i++) {
        call(url);
    }
}
module.exports = run;