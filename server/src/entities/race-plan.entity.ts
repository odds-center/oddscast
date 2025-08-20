import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('race_plans')
export class RacePlan {
  @PrimaryColumn({ type: 'varchar', length: 50, name: 'plan_id' })
  planId!: string;

  @Column({ type: 'varchar', length: 10 })
  meet!: string;

  @Column({ type: 'varchar', length: 100, name: 'meet_name' })
  meetName!: string;

  @Column({ type: 'varchar', length: 20, name: 'rc_date' })
  rcDate!: string;

  @Column({ type: 'varchar', length: 10, name: 'rc_no' })
  rcNo!: string;

  @Column({ type: 'varchar', length: 255, name: 'rc_name' })
  rcName!: string;

  @Column({ type: 'varchar', length: 20, name: 'rc_dist', nullable: true })
  rcDist?: string;

  @Column({ type: 'varchar', length: 50, name: 'rc_grade', nullable: true })
  rcGrade?: string;

  @Column({ type: 'varchar', length: 50, name: 'rc_prize', nullable: true })
  rcPrize?: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'rc_condition',
    nullable: true,
  })
  rcCondition?: string;

  @Column({ type: 'varchar', length: 50, name: 'rc_weather', nullable: true })
  rcWeather?: string;

  @Column({ type: 'varchar', length: 50, name: 'rc_track', nullable: true })
  rcTrack?: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'rc_track_condition',
    nullable: true,
  })
  rcTrackCondition?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'rc_start_time',
    nullable: true,
  })
  rcStartTime?: string;

  @Column({ type: 'varchar', length: 20, name: 'rc_end_time', nullable: true })
  rcEndTime?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
