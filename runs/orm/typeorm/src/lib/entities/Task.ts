import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("tasks")
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar", length: 50 })
  status!: "todo" | "in_progress" | "done";

  @Column({ type: "varchar", length: 50 })
  priority!: "low" | "medium" | "high" | "urgent";

  @Column({ type: "date", name: "due_date", nullable: true })
  dueDate!: string | null;

  @Column({ type: "timestamp with time zone", name: "created_at" })
  createdAt!: string;

  @Column({ type: "int", name: "project_id" })
  projectId!: number;

  @Column({ type: "int", name: "assignee_id", nullable: true })
  assigneeId!: number | null;

  @Column({ type: "timestamp with time zone", name: "archived_at", nullable: true })
  archivedAt!: string | null;
}
