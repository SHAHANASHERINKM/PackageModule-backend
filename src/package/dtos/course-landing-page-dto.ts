import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

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

  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @IsOptional()
  coverImage: string | null;

  @IsOptional()
  thumbnailImage: string | null;

  @IsOptional()
  videoFile: string | null;
}
