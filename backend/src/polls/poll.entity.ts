import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { Candidate } from "src/candidates/candidate.entity";

@Entity()
export class Poll {
    @PrimaryColumn({ type: 'varchar', length: 44 })
    pollAccount!: string; // PDA pubkey poll

    @Column({ type: 'bigint', nullable: true })
    pollId!: string | null; // u64

    @Column({ type: 'varchar', length: 64 })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({ type: 'bigint' })
    start!: string;

    @Column({ type: 'bigint' })
    end!: string;

    @Column({ type: "bigint" })
    optionIndex!: string;

    @OneToMany(() => Candidate, (c) => c.poll)
    candidates!: Candidate[];
}
