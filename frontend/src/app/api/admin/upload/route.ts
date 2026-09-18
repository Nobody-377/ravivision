import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB Limit

/**
 * Helper: Parse Google Drive share URL into direct streamable image URL
 */
function parseGoogleDriveUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();

  // Pattern 1: https://drive.google.com/file/d/FILE_ID/view...
  const matchFileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) {
    return `https://lh3.googleusercontent.com/d/${matchFileD[1]}`;
  }

  // Pattern 2: https://drive.google.com/open?id=FILE_ID or uc?id=FILE_ID
  const matchQueryId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchQueryId && matchQueryId[1]) {
    return `https://lh3.googleusercontent.com/d/${matchQueryId[1]}`;
  }

  // Pattern 3: If already a direct lh3 googleusercontent link
  if (trimmed.includes('googleusercontent.com/d/')) {
    return trimmed;
  }

  return null;
}

/**
 * POST /api/admin/upload
 * Supports:
 * 1. File Upload (Local Machine - FormData with 'file' or 'files')
 * 2. Google Drive Import (JSON body with 'gdriveUrl')
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Handle Google Drive Link Import (JSON payload)
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { gdriveUrl } = body;

      if (!gdriveUrl) {
        return NextResponse.json(
          { success: false, error: { message: 'Google Drive URL is required.' } },
          { status: 400 }
        );
      }

      const directUrl = parseGoogleDriveUrl(gdriveUrl);
      if (!directUrl) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message:
                'Invalid Google Drive link format. Please paste a valid shareable link (e.g. https://drive.google.com/file/d/YOUR_FILE_ID/view)',
            },
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        url: directUrl,
        source: 'gdrive',
        message: 'Google Drive image parsed successfully!',
      });
    }

    // Handle Local File Upload (FormData payload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const files = formData.getAll('file') as File[];

      if (!files || files.length === 0 || !(files[0] instanceof File)) {
        return NextResponse.json(
          { success: false, error: { message: 'No image files provided for upload.' } },
          { status: 400 }
        );
      }

      const uploadDir = join(process.cwd(), 'public', 'uploads', 'products');

      // Ensure target uploads directory exists
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const savedUrls: string[] = [];

      for (const file of files) {
        // Enforce 10MB size limit
        if (file.size > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json(
            {
              success: false,
              error: {
                message: `File "${file.name}" exceeds the maximum allowed limit of 10MB (${(
                  file.size /
                  (1024 * 1024)
                ).toFixed(2)}MB).`,
              },
            },
            { status: 400 }
          );
        }

        // Validate MIME type
        if (!file.type.startsWith('image/')) {
          return NextResponse.json(
            {
              success: false,
              error: { message: `File "${file.name}" is not a valid image format.` },
            },
            { status: 400 }
          );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Sanitize file extension
        const rawExt = file.name.split('.').pop() || 'jpg';
        const cleanExt = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const uniqueFileName = `prod_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 8)}.${cleanExt}`;

        const filePath = join(uploadDir, uniqueFileName);
        await writeFile(filePath, buffer);

        const publicUrl = `/uploads/products/${uniqueFileName}`;
        savedUrls.push(publicUrl);
      }

      return NextResponse.json({
        success: true,
        url: savedUrls[0],
        urls: savedUrls,
        message: `Successfully uploaded ${savedUrls.length} image(s)!`,
      });
    }

    return NextResponse.json(
      { success: false, error: { message: 'Unsupported upload request format.' } },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error handling product image upload:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message || 'Failed to save product image file.' },
      },
      { status: 500 }
    );
  }
}
