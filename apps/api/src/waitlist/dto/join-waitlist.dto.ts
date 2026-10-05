import { LOCALES, type Locale } from '@manta/shared';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class JoinWaitlistDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsOptional()
  @IsIn(LOCALES)
  locale?: Locale;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  source?: string;
}
