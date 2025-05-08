import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, OneToOne, JoinColumn } from 'typeorm';

import { UserDetails } from './user.entity';
import { ModulePackage } from './module_package.entity';
import { FeeDetails } from './fee.entities';

export enum PackageType {
  COURSE = 'course',
  PROJECT = 'project',
  PRACTICE_TEST = 'practice test',
}

@Entity('packages')
export class Package {
  @PrimaryGeneratedColumn()
  package_id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: false})
  description: string;

  @Column({ type: 'enum', enum: PackageType, nullable: false })
  type: PackageType;

  @Column({ type: 'boolean', default: false })
  is_free: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  language: string;

  @Column({ type: 'text', nullable: true })
  cover_image: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  target_audience: string;
  

  @ManyToOne(() => UserDetails, { nullable: true, onDelete: 'SET NULL' })
  instructor: UserDetails;

  @Column({ type: 'boolean', default: false })
  has_subtitles: boolean;

  @Column({ type: 'int', nullable: false })
  duration: number;

  @Column({ type: 'text', nullable: true })
  completion_benefit: string;

  @Column({ type: 'text', nullable: true })
  prerequisites: string;

  @Column({ type: 'boolean', default: false })
  is_published: boolean;

  @Column({ type: 'boolean', default: false })
  requires_unlock: boolean;

  @Column({ type: 'text', nullable: true })
  skills_gained: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToOne(() => FeeDetails, (feeDetails) => feeDetails.package, { cascade: true, onDelete: 'CASCADE' })
  feeDetails: FeeDetails;

  @Column({ type: 'text', nullable: true })
  thumbnailUrl: string | null;
  
  @Column({ type: 'text', nullable: true })
  promoVideoUrl: string | null;

  @Column({ type: 'int', nullable: true })
  no_of_seats: number | null;

  @Column({ type: 'int', nullable: true })
  cat_id: number | null;
  

  

}
