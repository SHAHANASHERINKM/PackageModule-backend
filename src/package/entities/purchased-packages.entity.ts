import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UserDetails } from './user.entity';
import { Packages } from './packages.entity';

@Entity('purchased_packages')
export class PurchasedPackage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserDetails, user => user.purchasedPackages)
  @JoinColumn({ name: 'user_id' })
  user: UserDetails;

  @ManyToOne(() => Packages, pkg => pkg.purchasedPackages)
  @JoinColumn({ name: 'package_id' })
  packages: Packages;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  purchaseDate: Date;
}
