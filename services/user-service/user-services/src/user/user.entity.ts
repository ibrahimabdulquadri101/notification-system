import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) 
  password_hash: string; 

  @Column({ type:'jsonb',nullable: true, name: 'push_token' })
  push_token: Record<string, any> | null; 

  @Column({ default: true, name: 'email_notifications_enabled' })
  email_notifications_enabled: boolean; 

  @Column({ default: true, name: 'push_notifications_enabled' })
  push_notifications_enabled: boolean; 

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}