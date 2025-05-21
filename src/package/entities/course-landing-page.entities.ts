import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Packages } from './packages.entity';

@Entity('course-landing-pages')
export class CourseLandingPage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'varchar', nullable: true })
  subtitle: string;

  @Column({ type: 'varchar' })
  description: string;

  @Column({ type: 'varchar' })
  language: string;

  @Column({ type: 'varchar' })
  level: string;

  @Column({ type: 'int' })
  categoryId: number;

  @Column({ type: 'varchar', nullable: true })
  coverImage: string | null;

  @Column({ type: 'varchar', nullable: true })
  thumbnailImage: string | null;

  @Column({ type: 'varchar', nullable: true })
  videoFile: string | null;

  @Column({ type: 'int', nullable: true })
  seats: number | null;

  @OneToOne(() => Packages, (packages) => packages.courseLandingPage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'package_id' })
  packages: Packages;
}