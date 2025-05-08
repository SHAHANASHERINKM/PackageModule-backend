import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Package } from "./package.entity";

@Entity()
export class Promotion {
  @PrimaryGeneratedColumn()
  promo_id: number;

  @Column({ type: 'varchar', length: 50, nullable: false,  })
  type: string; // Defines whether it is a 'free trial' or 'discount'

  @Column({ type: 'int', nullable: false })
  duration: number; // Promotion duration in days

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true})
  discount_percentage: number; // Discount percentage (for 'discount' type)

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  start_date: Date; // When the promotion starts

  @Column({ type: 'timestamp', nullable: true })
  end_date: Date; // When the promotion ends

  @ManyToOne(() => Package, { onDelete: "CASCADE" })
  package: Package; // Foreign key to the packages table
}
