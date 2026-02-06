const https = require('https');
// require('dotenv').config(); // Skip this as Docker injects env vars

const key = process.env.GOOGLE_API_KEY;
if (!key || key === 'dummy') {
    console.error("No valid GOOGLE_API_KEY found in process.env");
    console.log("Current Key:", key);
    process.exit(1);
}

// Handle multiple keys
const keys = key.split(',');
const firstKey = keys[0];

console.log(`Testing API Key: ${firstKey.substring(0, 5)}... (Length: ${firstKey.length})`);

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${firstKey}`;

console.log(`Fetching models from: ${url}`);

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        if (res.statusCode === 200) {
            try {
                const models = JSON.parse(data);
                console.log("Available Models:");
                if (models.models) {
                    models.models.forEach(m => console.log(` - ${m.name}`));
                } else {
                    console.log("No 'models' property in response:", data);
                }
            } catch (e) {
                console.error("Failed to parse JSON:", e);
                console.log("Raw Response:", data);
            }
        } else {
            console.error("Error Response:", data);
        }
    });
}).on('error', (e) => {
    console.error("Network Error:", e);
});
