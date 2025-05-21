import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Package } from './package.entity';
import { Packages } from './packages.entity';
import { CartItem } from './cart_items.entity';
import { WishList } from './wish-list.entites';
import { PurchasedPackage } from './purchased-packages.entity';

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

  @OneToMany(() => Packages, (pkg) => pkg.user)
  packages: Packages[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.user)
cartItems: CartItem[];

@OneToMany(() => WishList, (wishList) => wishList.user)
wishList: WishList[];

@OneToMany(() => PurchasedPackage, (purchase) => purchase.user)
purchasedPackages: PurchasedPackage[];

}
