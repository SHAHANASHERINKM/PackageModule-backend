import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { Package } from "./package.entity";

@Entity()
export class Community {
  @PrimaryGeneratedColumn()
  community_id: number;

  @OneToOne(() => Package, { onDelete: "CASCADE" })
  @JoinColumn({ name: "package_id" }) // Explicitly set foreign key column name
  package: Package;

  @Column({ type: "boolean", default: true })
  is_enabled: boolean;
}
