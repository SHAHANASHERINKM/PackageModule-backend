// success-message.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import {  Packages } from './packages.entity';

@Entity()
export class SuccessMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Packages, (packages) => packages.successMessage, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'packageId' }) // foreign key column name in this table
  packages: Packages;

  @Column({ type: 'text' })
  pageContent: string;

  
}
