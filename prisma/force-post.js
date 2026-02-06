
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

// Mocking the postToWordPress function logic from src/lib/wordpress.ts
// We duplicate it here to run it standalone with verbose logging
async function forcePost() {
    console.log("=== Force Post Diagnostic ===");

    // 1. Get Candidate
    const candidate = await prisma.article.findFirst({
        where: {
            status: 'PUBLISHED',
            isPostedExternally: false,
            qualityScore: { gte: 80 }
        },
        orderBy: { qualityScore: 'desc' }
    });

    if (!candidate) {
        console.log("No candidates found to post.");
        return;
    }

    console.log(`Attempting to post: "${candidate.title}"`);
    console.log(`ID: ${candidate.id}`);

    // 2. Get Account
    const accounts = await prisma.externalAccount.findMany({ where: { isActive: true } });
    let targetAccount = accounts.find(acc => acc.category === candidate.category);
    if (!targetAccount) targetAccount = accounts.find(acc => !acc.category);

    if (!targetAccount) {
        console.error("No suitable account found.");
        return;
    }

    console.log(`Target Account: ${targetAccount.name} (${targetAccount.apiUrl})`);
    console.log(`Username: ${targetAccount.username}`);
    
    // Check Password Format
    const isAppPassword = targetAccount.password.includes(' ') || targetAccount.password.length === 24; // App passwords are usually 4 blocks of 4 chars
    console.log(`Password Type Check: ${isAppPassword ? "Looks like App Password (OK)" : "WARNING: Looks like Login Password (FAIL)"}`);
    if (!isAppPassword) {
        console.log("--> Please ensure you are using an 'Application Password' generated in WP Admin > Users > Profile.");
        console.log("--> Do NOT use your regular login password.");
    }

    const auth = Buffer.from(`${targetAccount.username}:${targetAccount.password}`).toString('base64');

    // --- DIAGNOSTIC: Check User Capabilities ---
    try {
        console.log("Checking User Permissions...");
        const userRes = await fetch(`${targetAccount.apiUrl}/users/me?context=edit`, {
            headers: { 'Authorization': 'Basic ' + auth }
        });
        
        if (userRes.ok) {
            const userData = await userRes.json();
            console.log(`Authenticated as: ${userData.name} (ID: ${userData.id})`);
            console.log(`Roles: ${JSON.stringify(userData.roles)}`);
            console.log(`Capabilities: ${JSON.stringify(userData.capabilities)}`);
        } else {
            console.log(`User Check Failed: ${userRes.status} ${userRes.statusText}`);
            const errText = await userRes.text();
            console.log(`Error Body: ${errText}`);
        }
    } catch (err) {
        console.log("Error checking user:", err.message);
    }
    // -------------------------------------------

    // 3. Try Image Upload First (if needed)
    let featuredMediaId = undefined;
    if (candidate.imageUrl) {
        console.log(`Uploading image: ${candidate.imageUrl}`);
        try {
            // Basic Auth
            const auth = Buffer.from(`${targetAccount.username}:${targetAccount.password}`).toString('base64');
            
            // For this test, we skip actual file reading if it's local path and just verify we CAN read it
            // Or if it's remote, we try to fetch it.
            // Simplified logic for diagnostic:
            
            let blob;
            let filename = 'test-image.jpg';

            if (candidate.imageUrl.startsWith('http')) {
                const imgRes = await fetch(candidate.imageUrl);
                if (!imgRes.ok) throw new Error(`Failed to fetch remote image: ${imgRes.statusText}`);
                const arrayBuffer = await imgRes.arrayBuffer();
                blob = new Blob([arrayBuffer]);
            } else {
                 // Local file logic
                 // We need to resolve path relative to where this script runs (root of project usually in docker)
                 // Docker WORKDIR is /var/www/workflow (mapped to C:\xampp\htdocs\artikel)
                 const relativePath = candidate.imageUrl.startsWith('/') ? candidate.imageUrl.slice(1) : candidate.imageUrl;
                 const localPath = path.join(process.cwd(), 'public', relativePath);
                 if (fs.existsSync(localPath)) {
                     const buffer = fs.readFileSync(localPath);
                     blob = new Blob([buffer]);
                 } else {
                     console.warn(`Local image missing: ${localPath}. Skipping image upload.`);
                 }
            }

            if (blob) {
                const formData = new FormData();
                formData.append('file', blob, filename);
                formData.append('title', candidate.title);

                const uploadRes = await fetch(`${targetAccount.apiUrl}/media`, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Basic ' + auth,
                        // FormData sets Content-Type automatically
                    },
                    body: formData
                });

                const uploadText = await uploadRes.text();
                console.log(`Image Upload Response Status: ${uploadRes.status}`);
                
                if (uploadRes.ok) {
                    const uploadJson = JSON.parse(uploadText);
                    featuredMediaId = uploadJson.id;
                    console.log(`Image Uploaded! ID: ${featuredMediaId}`);
                } else {
                    console.error(`Image Upload Failed Body: ${uploadText.substring(0, 500)}`);
                }
            }

        } catch (e) {
            console.error("Image Upload Error:", e);
        }
    }

    // 4. Try Posting Article
    try {
        const auth = Buffer.from(`${targetAccount.username}:${targetAccount.password}`).toString('base64');
        const postData = {
            title: candidate.title,
            content: candidate.content,
            status: 'publish',
            featured_media: featuredMediaId
        };

        console.log("Sending Post Request...");
        const res = await fetch(`${targetAccount.apiUrl}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + auth,
            },
            body: JSON.stringify(postData)
        });

        const text = await res.text();
        console.log(`Post Response Status: ${res.status}`);
        
        if (!res.ok) {
            console.error(`Post Failed Body: ${text}`);
        } else {
            const json = JSON.parse(text);
            console.log(`SUCCESS! Posted with ID: ${json.id}`);
            console.log(`Link: ${json.link}`);
            
            // Note: We are NOT updating the database status in this diagnostic script
            // to allow the real cron to do it later, OR we can update it if you want.
            // For now, let's NOT update so we can retry if needed, or update manually.
            // Actually, if it succeeded, we probably SHOULD update it so it doesn't post double.
            
            await prisma.article.update({
                where: { id: candidate.id },
                data: {
                    isPostedExternally: true,
                    externalPlatform: 'WORDPRESS',
                    externalPostId: String(json.id),
                    postedAt: new Date()
                }
            });
            console.log("Database updated.");
        }

    } catch (e) {
        console.error("Post Error:", e);
    }
}

forcePost()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
