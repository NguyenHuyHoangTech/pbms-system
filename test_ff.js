fetch('http://localhost:8080/api/v1/iot/time/fast-forward', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetTime: '2026-06-27T10:00:00' })
}).then(r => r.text()).then(console.log).catch(console.error);
