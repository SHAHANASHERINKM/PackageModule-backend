// src/packages/entities/intended-learners.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

import {  Packages } from './packages.entity';

@Entity()
export class IntendedLearners {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Packages, (packages) => packages.package_id,  { onDelete: 'CASCADE' }) // Reference BasicInfo
  packages: Packages;

   @Column('text', { array: true, nullable: false, default: '{}' })
learningObjectives: string[];

 @Column('text', { array: true, nullable: false, default: '{}' })
  requirements: string[];

  @Column('text', { array: true, nullable: false, default: '{}' })
  audience: string[];

 
}
