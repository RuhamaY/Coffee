import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index(['name', 'type'])
@Entity()
export class Event{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    type: string;

    @Column()
    @Index()
    name: string;

    @Column()
    payload: Record < string, any>;
}