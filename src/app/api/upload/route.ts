import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Transloadit from 'transloadit';

const transloadit = new Transloadit({
  authKey: process.env.TRANSLOADIT_AUTH_KEY!,
  authSecret: process.env.TRANSLOADIT_AUTH_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as 'image' | 'video';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Create assembly params based on file type
    const params = {
      steps: {
        imported: {
          robot: '/upload/handle',
        },
        ...(type === 'image' ? {
          optimized: {
            use: 'imported',
            robot: '/image/optimize',
            progressive: true,
            format: 'jpg',
          },
        } : {
          encoded: {
            use: 'imported',
            robot: '/video/encode',
            preset: 'ipad-high',
            ffmpeg_stack: 'v6.0.0',
          },
        }),
      },
    };

    // Create assembly
    const assembly = await transloadit.createAssembly({
      params,
      files: {
        file: file,
      },
    });

    // Wait for assembly to complete
    const completedAssembly = await transloadit.awaitAssemblyCompletion(assembly.assembly_id);

    // Get the result URL
    let url = null;
    if (type === 'image' && completedAssembly.results.optimized?.[0]) {
      url = completedAssembly.results.optimized[0].ssl_url;
    } else if (type === 'video' && completedAssembly.results.encoded?.[0]) {
      url = completedAssembly.results.encoded[0].ssl_url;
    }

    return NextResponse.json({
      success: true,
      url,
      assembly_id: assembly.assembly_id,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
