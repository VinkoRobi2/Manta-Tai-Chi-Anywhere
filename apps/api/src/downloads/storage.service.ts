import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';

/** Firma enlaces temporales a Cloudflare R2 (compatible con S3). */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly devBaseUrl: string;
  private readonly isProduction: boolean;
  readonly ttlSeconds: number;

  constructor(config: ConfigService<Env, true>) {
    const accountId = config.get('R2_ACCOUNT_ID', { infer: true });
    const accessKeyId = config.get('R2_ACCESS_KEY_ID', { infer: true });
    const secretAccessKey = config.get('R2_SECRET_ACCESS_KEY', { infer: true });

    this.bucket = config.get('R2_BUCKET', { infer: true });
    this.devBaseUrl = config.get('CONTENT_DEV_BASE_URL', { infer: true }).replace(/\/$/, '');
    this.ttlSeconds = config.get('SIGNED_URL_TTL_SECONDS', { infer: true });
    this.isProduction = config.get('NODE_ENV', { infer: true }) === 'production';

    this.client =
      accountId && accessKeyId && secretAccessKey
        ? new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId, secretAccessKey },
          })
        : null;

    if (!this.client) {
      this.logger.warn(
        `R2 sin configurar: los enlaces apuntarán a ${this.devBaseUrl} (solo desarrollo)`,
      );
    }
  }

  async signedUrl(objectKey: string): Promise<string> {
    if (!this.client) {
      if (this.isProduction) {
        throw new ServiceUnavailableException('Almacenamiento de contenido no configurado');
      }
      return `${this.devBaseUrl}/${objectKey}`;
    }
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      {
        expiresIn: this.ttlSeconds,
      },
    );
  }
}
