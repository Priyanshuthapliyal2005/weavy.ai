import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Transloadit } from 'transloadit';

export const runtime = 'nodejs';

// Video encoding can take a while depending on file size.
export const maxDuration = 300;

const transloadit = new Transloadit({
  authKey: process.env.TRANSLOADIT_AUTH_KEY!,
  authSecret: process.env.TRANSLOADIT_AUTH_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    console.log('Upload request received');

    const contentLengthHeader = req.headers.get('content-length');
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null;
    if (contentLength && Number.isFinite(contentLength) && contentLength > 250 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large', details: 'Max upload size is 250MB.' },
        { status: 413 }
      );
    }
    
    const { userId } = await auth();
    
    if (!userId) {
      console.error('No userId found - user not authenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as 'image' | 'video';

    console.log('Processing upload:', file?.name, '- Type:', type);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('Converting file to buffer...');

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('Starting Transloadit assembly...');

    // Create assembly params
    const params: any = {
      steps: {
        ':original': {
          robot: '/upload/handle',
        },
        ...(type === 'image' ? {
          optimized: {
            use: ':original',
            robot: '/image/optimize',
            progressive: true,
            format: 'jpg',
          },
        } : {
          encoded: {
            use: ':original',
            robot: '/video/encode',
            preset: 'ipad-high',
            ffmpeg_stack: 'v6.0.0',
          },
        }),
      },
    };

    // Use 'uploads' with Buffer, not 'files' with File object
    const assembly = await transloadit.createAssembly({
      params,
      uploads: {
        [file.name]: buffer,
      },
      waitForCompletion: true,
    });

    console.log('Assembly completed:', assembly.assembly_id);

    // Get result URL
    let url = null;
    if (type === 'image' && assembly.results?.optimized?.[0]) {
      url = assembly.results.optimized[0].ssl_url;
    } else if (type === 'video' && assembly.results?.encoded?.[0]) {
      url = assembly.results.encoded[0].ssl_url;
    }

    console.log('Upload successful, URL:', url);
    
    return NextResponse.json({
      success: true,
      url,
      assembly_id: assembly.assembly_id,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Upload failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
