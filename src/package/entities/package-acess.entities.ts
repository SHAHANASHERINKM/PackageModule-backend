import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { UserDetails } from "./user.entity";
import { Package } from "./package.entity";

@Entity()
export class PackageAccess {
  @PrimaryGeneratedColumn()
  access_id: number;

  @ManyToOne(() => UserDetails, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" }) // Explicitly set column name
  user: UserDetails;

  @ManyToOne(() => Package, { onDelete: "CASCADE" })
  @JoinColumn({ name: "package_id" }) // Explicitly set column name
  package: Package;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  access_start: Date;

  @Column({ type: "timestamp", nullable: true })
  access_end: Date;

  @Column({ type: "boolean", default: false })
  notified: boolean;
}
