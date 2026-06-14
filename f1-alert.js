const _PORT = 3411;
const _NAME = 'alert';
const _VERSION = '0.1';

console.clear();
const http = require('http');
const path = require('path');
const { exec } = require('child_process');

let lastName = '';
const alert050 = path.join(__dirname,'alert050.wav');
const alert100 = path.join(__dirname,'alert100.wav');
const alert150 = path.join(__dirname,'alert150.wav');
const alert200 = path.join(__dirname,'alert200.wav');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const server = http.createServer(async (req, res) => {
    switch(true) {

        case req.url.startsWith('/alert?name=') :
            const name = req.url?.split('/alert?name=')[1];
            res.writeHead(200, {'Content-Type':'application/json'});
            res.end(`{"success":true, "name":"${name}"}`)

            // NEW TORRENT
            if(name != lastName) {

                lastName = name;
                console.log(`NEW TORRENT: ${name}`);

                // alert
                exec(`/usr/bin/paplay ${alert050}`);
                await sleep(4000);
                exec(`/usr/bin/paplay ${alert100}`);
                await sleep(4000);
                exec(`/usr/bin/paplay ${alert150}`);
                await sleep(4000);
                exec(`/usr/bin/paplay ${alert200}`);
            }
            break;
        // ERROR
        default:
            res.writeHead(404, {'Content-Type':'text/html'});
            res.end('Erreur 404 : page introuvable !');
    } 
});
server.listen(_PORT,() => {
    console.log(`${_NAME} ${_VERSION} : http://localhost:${_PORT}`);
    exec(`/usr/bin/paplay ${alert050}`);
});
