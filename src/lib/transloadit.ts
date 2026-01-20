import { Transloadit } from 'transloadit';

// Initialize Transloadit client
export const transloaditClient = new Transloadit({
  authKey: process.env.TRANSLOADIT_AUTH_KEY!,
  authSecret: process.env.TRANSLOADIT_AUTH_SECRET!,
});

// Upload file using Transloadit
export async function uploadFile(file: File, type: 'image' | 'video') {
  const formData = new FormData();
  formData.append('file', file);
  
  const params: any = {
    steps: {
      import: {
        robot: '/upload/handle',
      },
      ...(type === 'image' ? {
        optimize: {
          use: 'import',
          robot: '/image/optimize',
          progressive: true,
          strip: false,
        },
        store: {
          use: 'optimize',
          robot: '/s3/store',
          credentials: 'transloadit_default',
        },
      } : {
        encode: {
          use: 'import',
          robot: '/video/encode',
          preset: 'h264',
        },
        store: {
          use: 'encode',
          robot: '/s3/store',
          credentials: 'transloadit_default',
        },
      }),
    },
  };

  const assembly = await (transloaditClient as any).createAssembly({
    params,
    files: { file },
  });

  return assembly;
}

// Get upload URL from Transloadit result
export function getUploadUrl(assembly: any, type: 'image' | 'video'): string | null {
  const results = assembly.results;
  
  if (type === 'image' && results.optimize?.[0]?.ssl_url) {
    return results.optimize[0].ssl_url;
  }
  
  if (type === 'video' && results.encode?.[0]?.ssl_url) {
    return results.encode[0].ssl_url;
  }
  
  return null;
}
