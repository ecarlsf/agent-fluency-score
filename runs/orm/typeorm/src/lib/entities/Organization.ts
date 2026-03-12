import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("organizations")
export class Organization {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  slug!: string;
}
