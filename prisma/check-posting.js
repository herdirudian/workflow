
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log("=== WordPress Posting Diagnostic ===");
    
    // 1. Check Active Accounts
    const accounts = await prisma.externalAccount.findMany({ where: { isActive: true } });
    console.log(`\n1. Active External Accounts: ${accounts.length}`);
    if (accounts.length === 0) {
        console.error("   [ERROR] No active external accounts found! Please add one in Settings.");
    } else {
        accounts.forEach(acc => {
            console.log(`   - [${acc.name}] URL: ${acc.apiUrl} | Category: ${acc.category || '(All/General)'}`);
        });
    }

    // 2. Check Daily Limit
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const postedToday = await prisma.article.count({
        where: {
            isPostedExternally: true,
            postedAt: { gte: startOfDay }
        }
    });
    console.log(`\n2. Articles Posted Today: ${postedToday}/3 (Limit)`);
    if (postedToday >= 3) {
        console.warn("   [WARN] Daily limit reached. No more posts will occur today.");
    }

    // 3. Check Candidates
    const candidates = await prisma.article.findMany({
        where: {
            status: 'PUBLISHED',
            isPostedExternally: false,
        },
        orderBy: { qualityScore: 'desc' },
        take: 5
    });

    console.log(`\n3. Top 5 Pending 'PUBLISHED' Articles:`);
    if (candidates.length === 0) {
        console.log("   [INFO] No pending PUBLISHED articles found.");
    }

    for (const art of candidates) {
        console.log(`   - "${art.title}" (Score: ${art.qualityScore}, Category: ${art.category})`);
        
        if (art.qualityScore < 80) {
            console.log(`     -> [SKIP] Quality score < 80 (Required for auto-posting)`);
            continue;
        }

        // Simulate matching
        let target = accounts.find(acc => acc.category === art.category);
        if (!target) {
            target = accounts.find(acc => !acc.category); // Fallback
        }

        if (target) {
            console.log(`     -> [MATCH] Would post to: ${target.name}`);
        } else {
            console.log(`     -> [SKIP] No matching account found for category '${art.category}'`);
        }
    }
}

check()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
