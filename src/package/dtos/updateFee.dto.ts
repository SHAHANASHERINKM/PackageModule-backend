import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateFeeDto {
  @IsNumber()
  @Min(0)
  total_fee: number;

  @IsBoolean()
  @IsOptional()
  has_discount?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount_percentage?: number;

  @IsString()
  @IsOptional()
  payment_methods?: string;

  @IsBoolean()
  @IsOptional()
  financial_aid_available?: boolean;
}
