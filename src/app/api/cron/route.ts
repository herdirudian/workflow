import { NextResponse } from 'next/server';
import { runPipeline } from '@/lib/processor';
import { runScheduledPosting } from '@/lib/wordpress';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log("Cron triggered...");
    
    // 1. Run Fetch & Process Pipeline
    const results = await runPipeline();
    
    // 2. Run Auto-Posting to WordPress
    try {
        await runScheduledPosting();
    } catch (wpError) {
        console.error("WP Posting Error in Cron:", wpError);
    }

    return NextResponse.json({ success: true, processed: results.length, articles: results });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
