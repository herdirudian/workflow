
const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'public', 'images', 'articles');
console.log(`Checking write access to: ${dir}`);

try {
    if (!fs.existsSync(dir)) {
        console.log("Directory does not exist. Attempting to create...");
        fs.mkdirSync(dir, { recursive: true });
        console.log("Directory created.");
    }

    const testFile = path.join(dir, 'write_test.txt');
    fs.writeFileSync(testFile, 'Permission check passed!');
    console.log("Write success!");
    fs.unlinkSync(testFile);
    console.log("Cleanup success!");
} catch (e) {
    console.error("PERMISSION ERROR:", e.message);
}
