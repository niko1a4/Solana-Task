import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Poll } from "src/polls/poll.entity";

@Entity()
export class Candidate {
    @PrimaryColumn({ type: 'varchar', length: 44 })
    candidateAccount!: string; // PDA pubkey kandidata

    @Column({ type: 'varchar', length: 44, nullable: true })
    pollAccount!: string | null;  // foreign key ka Poll.pollAccount

    @ManyToOne(() => Poll, (p) => p.candidates, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'pollAccount', referencedColumnName: 'pollAccount' })
    poll!: Poll;

    @Column({ type: 'bigint', nullable: true })
    pollId!: string | null;  // u64 (string zbog BN), ali samo info

    @Column({ type: 'varchar', length: 64 })
    name!: string;

    @Column({ type: 'bigint', default: 0 })
    votes!: string;
}
