import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { CourseLandingPage } from './course-landing-page.entities';
import { FeeDetails } from './fee.entities';
import { IntendedLearners } from './intended-learners.entities';
import { SuccessMessage } from './success-message.entities';
import { UserDetails } from './user.entity';
import { Category } from './categories.entity';
import { CartItem } from './cart_items.entity';
import { WishList } from './wish-list.entites';
import { PurchasedPackage } from './purchased-packages.entity';

@Entity('packages')
export class Packages {
  @PrimaryGeneratedColumn()
  package_id: number;

  @Column({ nullable: false })
  title: string;

  
// packages.entity.ts
@OneToMany(() => CartItem, (cartItem) => cartItem.packages)
cartItems: CartItem[];

@OneToMany(()=>WishList,(wishList)=>wishList.packages)
wishList:WishList[];

 

  @Column({ type: 'boolean', default: true })
  is_free: boolean;


  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ type: 'varchar', default: 'unpublished' })
  status: string;

  @Column({ type: 'varchar', default: 'incomplete' })
  complete_status: string;

  @ManyToOne(() => UserDetails, (user) => user.packages, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: UserDetails;

  @ManyToOne(() => Category, (category) => category.packages, { eager: true })
@JoinColumn({ name: 'categoryId' })
category: Category;


  @OneToOne(() => CourseLandingPage, (courseLandingPage) => courseLandingPage.packages)
  courseLandingPage: CourseLandingPage;

  @OneToOne(() => FeeDetails, (feeDetails) => feeDetails.packages)
  feeDetails: FeeDetails;

   @OneToMany(() => IntendedLearners, (intendedLearner) => intendedLearner.packages,)
  intendedLearners: IntendedLearners[];

  @OneToOne(() => SuccessMessage, (successMessage) => successMessage.packages)
successMessage: SuccessMessage;

@OneToMany(() => PurchasedPackage, (purchase) => purchase.packages)
purchasedPackages: PurchasedPackage[];

}
