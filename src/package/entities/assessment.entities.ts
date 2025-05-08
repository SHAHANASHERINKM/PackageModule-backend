import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Package } from "./package.entity";

@Entity()
export class Assessment {
  @PrimaryGeneratedColumn()
  assessment_id: number;

  @ManyToOne(() => Package, { onDelete: "CASCADE" })
  package: Package;

  @Column({
    type: "varchar",
    length: 50,
    nullable: false,
    default: "quiz",
  })
  type: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "boolean", default: false })
  unlock_required: boolean;
}
