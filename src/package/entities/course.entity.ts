import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Package } from "./package.entity";

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn()
  course_id: number;

  @ManyToOne(() => Package,  { onDelete: 'CASCADE' })
  package: Package;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', nullable: false })
  duration: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
