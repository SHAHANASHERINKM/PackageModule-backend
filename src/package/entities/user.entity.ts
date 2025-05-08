import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Package } from './package.entity';

@Entity('users') // This creates the "users" table
export class UserDetails {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    default: 'student',
  })
  role: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => Package, (pkg) => pkg.instructor)
 pkg: Package[];

}
