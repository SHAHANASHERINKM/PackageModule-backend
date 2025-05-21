// cart-item.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';

import { Packages } from './packages.entity';
import { UserDetails } from './user.entity';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserDetails, (user) => user.cartItems, { onDelete: 'CASCADE' })
  user: UserDetails;

  @ManyToOne(() => Packages, (pkg) => pkg.cartItems, { onDelete: 'CASCADE' })
  packages: Packages;

  @CreateDateColumn()
  added_on: Date;
}
