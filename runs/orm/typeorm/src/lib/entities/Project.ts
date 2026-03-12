import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("projects")
export class Project {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar", length: 50 })
  status!: "active" | "archived" | "planning";

  @Column({ type: "int", name: "organization_id" })
  organizationId!: number;
}
