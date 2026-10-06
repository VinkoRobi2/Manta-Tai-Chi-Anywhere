import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AppleSignInDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  identityToken: string;

  /** Apple manda el nombre solo la primera vez que la persona entra: la app lo reenvía. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string | null;
}

export class GoogleSignInDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  idToken: string;
}
