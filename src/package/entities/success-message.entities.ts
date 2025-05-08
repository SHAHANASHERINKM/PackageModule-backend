// success-message.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class SuccessMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  packageId: number;

  @Column({ type: 'text' })
  pageContent: string;
}
