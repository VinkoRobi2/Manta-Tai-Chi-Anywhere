import { LOCALES, type Locale } from '@manta/shared';
import { IsIn, IsOptional } from 'class-validator';

export class RequestDownloadDto {
  @IsOptional()
  @IsIn(LOCALES)
  locale?: Locale;
}
