// src/intended-learners/dto/create-intended-learners.dto.ts

import { IsArray, IsString } from 'class-validator';

export class CreateIntendedLearnersDto {
  @IsArray()
  @IsString({ each: true })
  learningObjectives: string[];

  @IsArray()
  @IsString({ each: true })
  requirements: string[];

  @IsArray()
  @IsString({ each: true })
  audience: string[];
}
