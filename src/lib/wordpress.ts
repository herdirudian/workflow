
import { prisma } from './prisma'

// Configuration (Now using DB)
interface WPPostData {
    title: string;
    content: string;
    status: 'publish' | 'draft';
    featured_media?: number; // Media ID if we upload image first
}

async function uploadImageToWP(imageUrl: string, title: string, apiUrl: string, user: string, pass: string): Promise<number | null> {
    try {
        // Download image first
        const imageRes = await fetch(imageUrl);
        const blob = await imageRes.blob();
        
        const formData = new FormData();
        formData.append('file', blob, 'image.jpg');
        formData.append('title', title);
        
        const res = await fetch(`${apiUrl}/media`, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64'),
            },
            body: formData
        });

        if (!res.ok) throw new Error(`WP Image Upload Failed: ${res.statusText}`);
        const data = await res.json();
        return data.id;
    } catch (e) {
        console.error("Failed to upload image to WP:", e);
        return null;
    }
}

export async function postToWordPress(articleId: string) {
    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) throw new Error("Article not found");
    if (article.isPostedExternally) {
        console.log("Article already posted externally");
        return;
    }

    // Get Active Accounts
    const accounts = await prisma.externalAccount.findMany({ where: { isActive: true } });
    if (accounts.length === 0) {
        console.log("No active external accounts found.");
        return;
    }

    // Determine target account based on category
    // Logic:
    // 1. Try to find an account with EXACT category match
    // 2. If not found, look for a "General" account (category is null or empty)
    // 3. If neither, skip posting (or post to first one? Let's be strict for now to avoid spamming wrong blogs)
    
    let targetAccount = accounts.find(acc => acc.category === article.category);
    
    if (!targetAccount) {
        // Fallback to general account
        targetAccount = accounts.find(acc => !acc.category);
    }

    if (!targetAccount) {
        console.log(`No suitable account found for category: ${article.category}`);
        return;
    }

    const account = targetAccount;
    console.log(`Posting to ${account.name} (${account.apiUrl}) for category ${article.category}...`);

    try {
        // First upload image if exists
        let featuredMediaId = undefined;
        if (article.imageUrl) {
            console.log("Uploading image...");
            const mediaId = await uploadImageToWP(
                article.imageUrl, 
                article.title, 
                account.apiUrl, 
                account.username, 
                account.password
            );
            if (mediaId) featuredMediaId = mediaId;
        }

        const postData: WPPostData = {
            title: article.title,
            content: article.content, // Image is now featured_media, so we don't need to embed it necessarily, or we can keep it.
            status: 'publish',
            featured_media: featuredMediaId
        };

        const res = await fetch(`${account.apiUrl}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(`${account.username}:${account.password}`).toString('base64'),
            },
            body: JSON.stringify(postData)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`WP Post Failed: ${res.status} - ${errorText}`);
        }

        const data = await res.json();
        console.log(`Successfully posted to WP. ID: ${data.id}`);

        // Update DB
        await prisma.article.update({
            where: { id: articleId },
            data: {
                isPostedExternally: true,
                externalPlatform: 'WORDPRESS',
                externalPostId: String(data.id),
                postedAt: new Date()
            }
        });

        return data;

    } catch (error) {
        console.error("WordPress Posting Error:", error);
        throw error;
    }
}

export async function runScheduledPosting() {
    // Check if we should post now
    // Rule: Max 3 posts per day.
    // Check how many posted today
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    
    const count = await prisma.article.count({
        where: {
            isPostedExternally: true,
            postedAt: { gte: startOfDay }
        }
    });

    if (count >= 3) {
        console.log("Daily limit of 3 posts reached. Skipping.");
        return;
    }

    // Find best candidate
    // Must be PUBLISHED locally, NOT posted externally, High Score
    const candidate = await prisma.article.findFirst({
        where: {
            status: 'PUBLISHED',
            isPostedExternally: false,
            qualityScore: { gte: 80 } // Only high quality
        },
        orderBy: { qualityScore: 'desc' }
    });

    if (!candidate) {
        console.log("No suitable articles found for posting.");
        return;
    }

    await postToWordPress(candidate.id);
}
