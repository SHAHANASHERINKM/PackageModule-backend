import { IsNumber, IsOptional, IsBoolean, IsString, IsObject } from 'class-validator';

export class AddFeeDto {
  
  @IsNumber()
  total_fee?: number;

  @IsObject()
  individual_course_fee: object; // Must be a valid JSON object

  @IsBoolean()
  has_discount: boolean;

  @IsOptional()
  @IsNumber()
  discount_percentage?: number | null; 

  @IsOptional()
  @IsString()
  payment_methods?: string; // Optional field

  @IsBoolean()
  financial_aid_available: boolean;

  @IsNumber()
  packageId: number; // Foreign key reference to the Package entity
}
