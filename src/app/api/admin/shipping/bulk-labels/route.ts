/**
 * Admin Shipping - Bulk Label Generation API
 * Generates shipping labels in bulk and creates ZIP download
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 5.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { easyParcelService } from '@/lib/shipping/easyparcel-service';
import { z } from 'zod';
import archiver from 'archiver';
import { promises as fs } from 'fs';
import path from 'path';

const bulkLabelSchema = z.object({
  shipmentIds: z.array(z.string()).min(1).max(50), // Limit bulk operations
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { shipmentIds } = bulkLabelSchema.parse(body);

    // Use singleton EasyParcel service
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    const labelFiles: { filename: string; buffer: Buffer }[] = [];

    // Ensure shipping labels directory exists
    const labelsDir = path.join(process.cwd(), 'public', 'shipping-labels');
    try {
      await fs.access(labelsDir);
    } catch {
      await fs.mkdir(labelsDir, { recursive: true });
    }

    // Process each shipment
    for (const shipmentId of shipmentIds) {
      try {
        // Find the shipment
        const shipment = await prisma.shipment.findUnique({
          where: { id: shipmentId },
          include: {
            order: {
              select: {
                orderNumber: true,
                id: true
              }
            }
          }
        });

        if (!shipment) {
          results.push({
            shipmentId,
            success: false,
            error: 'Shipment not found'
          });
          errorCount++;
          continue;
        }

        // Check if shipment is booked
        if (!shipment.easyParcelShipmentId) {
          results.push({
            shipmentId,
            success: false,
            error: 'Shipment not booked with EasyParcel yet'
          });
          errorCount++;
          continue;
        }

        // Check if label already exists and is valid
        let labelBuffer: Buffer;
        let labelGenerated = false;

        if (shipment.labelUrl && shipment.labelGenerated) {
          try {
            // Try to read existing label
            const existingLabelPath = path.join(labelsDir, path.basename(shipment.labelUrl));
            labelBuffer = await fs.readFile(existingLabelPath);
            labelGenerated = true;
          } catch {
            // Label file doesn't exist, need to regenerate
            labelGenerated = false;
          }
        }

        if (!labelGenerated) {
          // Generate new label from EasyParcel
          labelBuffer = await easyParcelService.generateLabel(shipment.easyParcelShipmentId);
          
          // Save label to file system
          const labelFilename = `${shipment.order.orderNumber}-${shipment.easyParcelShipmentId}.pdf`;
          const labelPath = path.join(labelsDir, labelFilename);
          await fs.writeFile(labelPath, labelBuffer);

          // Update shipment record
          await prisma.shipment.update({
            where: { id: shipment.id },
            data: {
              labelUrl: `/shipping-labels/${labelFilename}`,
              labelGenerated: true,
              status: shipment.status === 'BOOKED' ? 'LABEL_GENERATED' : shipment.status,
              updatedAt: new Date()
            }
          });
        }

        // Add to ZIP collection
        const labelFilename = `${shipment.order.orderNumber}-${shipment.easyParcelShipmentId}.pdf`;
        labelFiles.push({
          filename: labelFilename,
          buffer: labelBuffer
        });

        results.push({
          shipmentId,
          success: true,
          orderNumber: shipment.order.orderNumber,
          trackingNumber: shipment.trackingNumber,
          labelFilename
        });
        successCount++;

      } catch (error) {
        console.error(`Error generating label for shipment ${shipmentId}:`, error);
        results.push({
          shipmentId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        errorCount++;
      }
    }

    // Create ZIP file if we have any successful labels
    let zipDownloadUrl = null;
    if (labelFiles.length > 0) {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const zipFilename = `shipping-labels-${timestamp}.zip`;
        const zipPath = path.join(labelsDir, zipFilename);

        // Create ZIP archive
        const archive = archiver('zip', {
          zlib: { level: 9 } // Maximum compression
        });

        const output = require('fs').createWriteStream(zipPath);
        archive.pipe(output);

        // Add each label to the ZIP
        labelFiles.forEach(file => {
          archive.append(file.buffer, { name: file.filename });
        });

        await archive.finalize();

        // Wait for the ZIP to be written
        await new Promise((resolve, reject) => {
          output.on('close', resolve);
          output.on('error', reject);
        });

        zipDownloadUrl = `/shipping-labels/${zipFilename}`;

        // Clean up old ZIP files (keep only last 10)
        const labelsDirContents = await fs.readdir(labelsDir);
        const zipFiles = labelsDirContents
          .filter(file => file.endsWith('.zip'))
          .map(file => ({
            name: file,
            path: path.join(labelsDir, file),
            stat: require('fs').statSync(path.join(labelsDir, file))
          }))
          .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());

        // Delete old ZIP files (keep only the 10 most recent)
        if (zipFiles.length > 10) {
          for (const oldZip of zipFiles.slice(10)) {
            try {
              await fs.unlink(oldZip.path);
            } catch (error) {
              console.warn('Failed to delete old ZIP file:', oldZip.name, error);
            }
          }
        }

      } catch (zipError) {
        console.error('Error creating ZIP file:', zipError);
        // Continue without ZIP - individual labels were still generated
      }
    }

    return NextResponse.json({
      success: successCount > 0,
      results,
      downloadUrl: zipDownloadUrl,
      summary: {
        total: shipmentIds.length,
        successCount,
        errorCount,
        successRate: `${Math.round((successCount / shipmentIds.length) * 100)}%`,
        labelsGenerated: labelFiles.length,
        zipCreated: !!zipDownloadUrl
      }
    });

  } catch (error) {
    console.error('Error in bulk label generation:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk label generation' },
      { status: 500 }
    );
  }
}