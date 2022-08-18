import { deserializeUnchecked } from '@dao-xyz/borsh';
import { broadcastEvent } from '@ingl/dialect-sdk';
import {
  CONNECTION_URL,
  GlobalGems,
  GLOBAL_GEM_KEY,
  INGL_PROGRAM_ID,
  PROPOSAL_KEY,
  ValidatorProposal,
  VOTE_ACCOUNT_KEY,
  VOTE_DATA_ACCOUNT_KEY,
} from '@ingl/state';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Connection, PublicKey } from '@solana/web3.js';
import * as fs from 'fs';

export const toBytesInt32 = (num: number) => {
  const arr = new Uint8Array([
    (num & 0xff000000) >> 24,
    (num & 0x00ff0000) >> 16,
    (num & 0x0000ff00) >> 8,
    num & 0x000000ff,
  ]);
  return arr;
};

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private connection = new Connection(CONNECTION_URL);

  getData(): { message: string } {
    return { message: 'Welcome to notifyer!' };
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async broadcast() {
    try {
      this.logger.log('Broadcasting....');
      const [global_gem_pubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(GLOBAL_GEM_KEY)],
        INGL_PROGRAM_ID
      );

      const globalGemAccountInfo = await this.connection.getAccountInfo(
        global_gem_pubkey
      );

      const { proposal_numeration: current_proposal_numeration } =
        deserializeUnchecked(GlobalGems, globalGemAccountInfo?.data as Buffer);

      const [vote_account_key] = PublicKey.findProgramAddressSync(
        [
          Buffer.from(VOTE_ACCOUNT_KEY),
          Buffer.from(toBytesInt32(current_proposal_numeration - 1)),
        ],
        INGL_PROGRAM_ID
      );
      const [ingl_vote_data_key] = PublicKey.findProgramAddressSync(
        [Buffer.from(VOTE_DATA_ACCOUNT_KEY), vote_account_key.toBuffer()],
        INGL_PROGRAM_ID
      );
      const inglVoteDataAccount = await this.connection.getAccountInfo(
        ingl_vote_data_key
      );
      const dataString = fs.readFileSync('data.json');
      const oldData: {
        vote_account_key: string;
        proposal_numeration: number;
        date_finalized: number;
      } = JSON.parse(dataString.toString());
      if (
        inglVoteDataAccount?.owner.toString() === INGL_PROGRAM_ID.toString() &&
        oldData.vote_account_key !== vote_account_key.toString()
      ) {
        this.logger.log('New Vote Account');
        await broadcastEvent(
          'New Ingl Vote Account Created',
          `A new vote account has been created. Please delegate your NFT and receive voting rewards.  https://app.ingl.io/nft`
        );
        fs.writeFileSync(
          './data.json',
          JSON.stringify({
            ...oldData,
            vote_account_key: vote_account_key.toString(),
          })
        );
      }

      if (current_proposal_numeration > oldData.proposal_numeration) {
        this.logger.log('New Proposal');
        await broadcastEvent(
          'New Validator Selection Proposal',
          `A new validator selection proposal has been created. Please vote on the best suited validator at https://app.ingl.io/dao`
        );
        fs.writeFileSync(
          './data.json',
          JSON.stringify({
            ...oldData,
            proposal_numeration: current_proposal_numeration,
          })
        );
      }

      const [proposal_pubkey] = PublicKey.findProgramAddressSync(
        [
          Buffer.from(PROPOSAL_KEY),
          toBytesInt32(current_proposal_numeration - 1),
        ],
        INGL_PROGRAM_ID
      );
      const proposalAccountInfo = await this.connection.getAccountInfo(
        proposal_pubkey
      );
      if (proposalAccountInfo) {
        const { date_finalized } = deserializeUnchecked(
          ValidatorProposal,
          proposalAccountInfo.data
        );
        if (date_finalized !== oldData.date_finalized) {
          this.logger.log('Proposal Finalized');
          await broadcastEvent(
            'Ingl Proposal Finalized',
            `A proposal has been finalized. Get ready to delegate once a vote account is created. https://app.ingl.io/nft`
          );
          fs.writeFileSync(
            './data.json',
            JSON.stringify({
              ...oldData,
              date_finalized: date_finalized,
            })
          );
        }
      }
    } catch (err) {
      this.logger.error(err);
    }
  }
}
