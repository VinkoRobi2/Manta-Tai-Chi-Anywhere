import { PracticeUploadSchema, type PracticeList, type PracticeUploadResult } from '@manta/shared';
import { BadRequestException, Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { CurrentUserId, SessionGuard } from '../auth/session.guard.js';
import { PracticeService } from './practice.service.js';

/** Las prácticas de la persona con sesión. Sin sesión, la app las guarda solo en el teléfono. */
@Controller('me/sessions')
@UseGuards(SessionGuard)
export class PracticeController {
  constructor(private readonly practice: PracticeService) {}

  @Get()
  list(@CurrentUserId() userId: string): Promise<PracticeList> {
    return this.practice.list(userId);
  }

  @Put()
  upload(@CurrentUserId() userId: string, @Body() body: unknown): Promise<PracticeUploadResult> {
    // El formato es el mismo que valida la app: PracticeUploadSchema de @manta/shared.
    const parsed = PracticeUploadSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
      );
    }
    return this.practice.upload(userId, parsed.data.sessions);
  }
}
