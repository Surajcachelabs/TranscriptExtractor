const DRIVE_BASE = 'https://www.googleapis.com/drive/v3/files';

export interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
}

export class DriveApiError extends Error {
  status?: number;
  body?: string;

  constructor(message: string, status?: number, body?: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export function extractFileIdFromDriveUrl(url: string): string | null {
  if (!url) return null;
  try {
    const patterns = [
      /https?:\/\/drive\.google\.com\/file\/d\/([^/]+)/i,
      /https?:\/\/drive\.google\.com\/open\?id=([^&]+)/i,
      /https?:\/\/drive\.google\.com\/uc\?id=([^&]+)/i,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }

    return null;
  } catch (err) {
    return null;
  }
}

export async function getDriveFileMetadata(
  fileId: string,
  accessToken: string
): Promise<DriveFileMetadata> {
  const response = await fetch(`${DRIVE_BASE}/${fileId}?fields=id,name,mimeType,size`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new DriveApiError('Failed to fetch file metadata from Google Drive', response.status, body);
  }

  return (await response.json()) as DriveFileMetadata;
}

export async function downloadDriveFile(
  fileId: string,
  accessToken: string
): Promise<Buffer> {
  const response = await fetch(`${DRIVE_BASE}/${fileId}?alt=media`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new DriveApiError('Failed to download file content from Google Drive', response.status, body);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

import { Readable } from 'stream';

// Returns a Node.js readable stream for the Drive file to allow piping into ffmpeg without buffering everything.
export async function downloadDriveFileStream(
  fileId: string,
  accessToken: string
): Promise<Readable> {
  const response = await fetch(`${DRIVE_BASE}/${fileId}?alt=media`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new DriveApiError('Failed to download file content from Google Drive', response.status, body);
  }

  const webStream = response.body;
  if (!webStream) {
    throw new DriveApiError('Drive response missing body stream', response.status);
  }

  try {
    // Convert the web ReadableStream into a Node Readable via async iterator; avoids relying on Readable.fromWeb.
    const asyncIterable = (async function* () {
      const reader = (webStream as any).getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) yield Buffer.from(value);
        }
      } finally {
        reader.releaseLock();
        if ((webStream as any).cancel) {
          try {
            await (webStream as any).cancel();
          } catch {}
        }
      }
    })();

    return Readable.from(asyncIterable as any);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown stream conversion error';
    throw new DriveApiError(`Failed to convert Drive response to stream: ${message}`, response.status);
  }
}
