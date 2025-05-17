
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Packages } from './packages.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  cat_id: number;

  @Column({ nullable: false })
  categoryName: string;

  @OneToMany(() => Packages, (pkg) => pkg.category)
  packages: Packages[];

 
}
