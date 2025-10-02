import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';

// Configuration for allowed file types and sizes
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_REQUEST = 5;

interface UploadResponse {
  success: boolean;
  files?: {
    id: string;
    originalName: string;
    fileName: string;
    url: string;
    type: string;
    size: number;
    mimeType: string;
  }[];
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    // Get form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    // Validation
    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No files provided'
      }, { status: 400 });
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json({
        success: false,
        error: `Too many files. Maximum ${MAX_FILES_PER_REQUEST} files allowed.`
      }, { status: 400 });
    }

    // Validate each file
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({
          success: false,
          error: `File type ${file.type} is not allowed`
        }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({
          success: false,
          error: `File ${file.name} exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
        }, { status: 400 });
      }
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'chat');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, continue
    }

    // Process and save files
    const uploadedFiles = [];

    for (const file of files) {
      try {
        // Generate unique filename
        const fileId = nanoid();
        const extension = file.name.split('.').pop() || '';
        const fileName = `${fileId}.${extension}`;
        const filePath = join(uploadDir, fileName);

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Create file metadata
        const fileMetadata = {
          id: fileId,
          originalName: file.name,
          fileName: fileName,
          url: `/uploads/chat/${fileName}`,
          type: getFileType(file.type),
          size: file.size,
          mimeType: file.type
        };

        uploadedFiles.push(fileMetadata);

      } catch (fileError) {
        console.error(`Failed to upload file ${file.name}:`, fileError);
        return NextResponse.json({
          success: false,
          error: `Failed to upload file ${file.name}`
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

function getFileType(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}

// Handle other methods
export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed'
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed'
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed'
  }, { status: 405 });
}