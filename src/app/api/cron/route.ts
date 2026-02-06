import { NextResponse } from 'next/server';
import { runPipeline } from '@/lib/processor';
import { runScheduledPosting } from '@/lib/wordpress';

export const dynamic = 'force-dynamic';

// Simple in-memory lock to prevent concurrent execution
let isProcessing = false;

export async function GET(request: Request) {
  if (isProcessing) {
    return NextResponse.json({ 
      success: false, 
      message: 'Cron job is already running in the background.' 
    }, { status: 429 });
  }

  try {
    console.log("Cron triggered...");
    isProcessing = true;
    
    // Run in background (Fire and Forget)
    // We do NOT await this promise in the response flow
    (async () => {
        // 1. Run Pipeline
        try {
            console.log("Starting background pipeline...");
            const results = await runPipeline();
            console.log(`Background pipeline finished. Processed: ${results.length}`);
        } catch (err) {
            console.error("Background Pipeline Error:", err);
            // Continue to posting even if pipeline fails
        }

        // 2. Run Scheduled Posting
        try {
            console.log("Starting background scheduled posting...");
            await runScheduledPosting();
            console.log("Background scheduled posting finished.");
        } catch (err) {
            console.error("Background Scheduled Posting Error:", err);
        } finally {
            isProcessing = false;
        }
    })();

    // Return immediate response to prevent 504 Gateway Time-out
    return NextResponse.json({ 
        success: true, 
        message: 'Cron job started in background. Check server logs for progress.' 
    }, { status: 202 });

  } catch (error) {
    isProcessing = false;
    console.error("Cron Launch Error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
