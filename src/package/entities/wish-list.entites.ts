
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';

import { Packages } from './packages.entity';
import { UserDetails } from './user.entity';

@Entity('wish_list')
export class WishList {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserDetails, (user) => user.wishList, { onDelete: 'CASCADE' })
  user: UserDetails;

  @ManyToOne(() => Packages, (pkg) => pkg.wishList, { onDelete: 'CASCADE' })
  packages: Packages;

  @CreateDateColumn()
  added_on: Date;
}
