import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export enum ModuleType {
  WEBINAR = "webinar",
  COURSE = "course",
}

@Entity()
export class ModulePackage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  module_id: number;

  @Column({ type: "enum", enum: ModuleType, nullable: false })
  module_type: ModuleType;

  @Column({ type: "int", nullable: false }) // Storing an array of package IDs
  package_id: number;
}
