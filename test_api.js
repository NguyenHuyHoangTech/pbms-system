const axios = require('axios');

async function test() {
    try {
        const auth = await axios.post('http://localhost:8080/identity/auth/login', {
            email: 'admin@pbms.com',
            password: 'password' // wait, I don't know the admin password? Let's use staff
        });
        const token = auth.data.data.token;
        console.log("Token:", token);

        const res = await axios.get('http://localhost:8080/operation/gates/checkout-session-info?plate=30A-301.79', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(e.response?.data || e.message);
    }
}
test();
