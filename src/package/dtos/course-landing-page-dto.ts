import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateCourseLandingPageDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  subtitle: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsNotEmpty()
  level: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @IsOptional()
  coverImage: string | null;

  @IsOptional()
  thumbnailImage: string | null;

  @IsOptional()
  videoFile: string | null;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Transform(({ value }) => (value === '' ? null : value))
  seats: number | null;
}