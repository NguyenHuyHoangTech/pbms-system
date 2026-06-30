const axios = require('axios');

async function test() {
    try {
        const loginRes = await axios.post('http://localhost:8080/api/v1/auth/login', {
            email: 'manager@pbms.com',
            password: 'password123'
        });
        const token = loginRes.data.data.token;
        const res = await axios.get('http://localhost:8080/api/v1/parking-sessions/all?page=0&size=10', {
            headers: { Authorization: 'Bearer ' + token }
        });
        console.log(JSON.stringify(res.data).substring(0, 500));
    } catch (e) {
        console.error("ERROR:", e.response ? e.response.data : e.message);
    }
}
test();
