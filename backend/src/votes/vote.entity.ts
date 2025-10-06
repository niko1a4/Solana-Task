import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Vote {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'bigint' })
    pollId!: string;  // u64

    @Column({ type: 'varchar', length: 44 })
    candidateAccount!: string;  // PDA kandidata

    @Column({ type: 'varchar', length: 44 })
    voter!: string;

    @Column({ type: 'varchar', length: 88 })
    tx!: string; // signature (base58)

    @Column({ type: 'bigint' })
    slot!: string;

    @Column({ type: 'bigint' })
    blockTime!: number;
}
