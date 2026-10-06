import { ProgressSnapshotSchema, type ProgressResponse } from '@manta/shared';
import { BadRequestException, Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { CurrentUserId, SessionGuard } from '../auth/session.guard.js';
import { ProgressService } from './progress.service.js';

/** El progreso de la persona con sesión. Sin sesión, la app lo guarda solo en el teléfono. */
@Controller('me/progress')
@UseGuards(SessionGuard)
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get()
  get(@CurrentUserId() userId: string): Promise<ProgressResponse> {
    return this.progress.get(userId);
  }

  @Put()
  save(@CurrentUserId() userId: string, @Body() body: unknown): Promise<ProgressResponse> {
    // El formato es el mismo que valida la app: ProgressSnapshotSchema de @manta/shared.
    const parsed = ProgressSnapshotSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
      );
    }
    return this.progress.save(userId, parsed.data);
  }
}
