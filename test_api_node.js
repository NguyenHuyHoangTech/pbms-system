const http = require('http');

const loginData = JSON.stringify({
    email: 'systemadministratorweb@gmail.com',
    123456: '123456'
});

const req = http.request({
    hostname: 'localhost',
    port: 8080,
    path: '/identity/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        const token = JSON.parse(data).data.token;
        console.log("Token:", token.substring(0, 10) + "...");
        
        http.get({
            hostname: 'localhost',
            port: 8080,
            path: '/operation/gates/checkout-session-info?plate=30A-301.79',
            headers: { 'Authorization': 'Bearer ' + token }
        }, (res2) => {
            let data2 = '';
            res2.on('data', chunk => { data2 += chunk; });
            res2.on('end', () => {
                console.log(JSON.stringify(JSON.parse(data2), null, 2));
            });
        });
    });
});

req.write(loginData);
req.end();
