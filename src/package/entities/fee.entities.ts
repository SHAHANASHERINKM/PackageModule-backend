import { Column, Entity, OneToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";

import { Packages } from "./packages.entity";

@Entity()
export class FeeDetails {
  @PrimaryGeneratedColumn()
  fee_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false})
  total_fee: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true})
  first_payment: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true})
  recurring_amount: number | null;

  @Column({ type: 'boolean', default: false })
  is_recurring: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  number_of_months: number | null;

  
  @Column({ type: 'boolean', default: false })
  has_discount: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discount_value: number | null;

  @Column({ type: 'text', nullable: true })
  discount_type: string | null;

  @Column({ type: 'text', nullable: true })
  payment_methods: string; // Stores available payment options

  @Column({ type: 'boolean', default: false })
  allow_min_amount: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  min_amount: number | null;

 

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  

  @OneToOne(() => Packages, { onDelete: 'CASCADE' })
@JoinColumn()
packages: Packages;
}
