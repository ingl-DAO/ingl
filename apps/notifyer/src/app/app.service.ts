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
      // this.logger.log('Ingl Event Broadcasting...');

      const [global_gem_pubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(GLOBAL_GEM_KEY)],
        INGL_PROGRAM_ID
      );

      const globalGemAccountInfo = await this.connection.getAccountInfo(
        global_gem_pubkey
      );

      const globalGemsData = deserializeUnchecked(
        GlobalGems,
        globalGemAccountInfo?.data as Buffer
      );

      const globalGemString = fs.readFileSync('./data.json');
      const oldGlobalGemsData: GlobalGems = JSON.parse(
        globalGemString.toString()
      );
      
      if (
        oldGlobalGemsData.proposal_numeration <
        globalGemsData.proposal_numeration
      ) {
        const [vote_account_key] = PublicKey.findProgramAddressSync(
          [
            Buffer.from(VOTE_ACCOUNT_KEY),
            Buffer.from(toBytesInt32(oldGlobalGemsData.proposal_numeration)),
          ],
          INGL_PROGRAM_ID
        );
        const [ingl_vote_data_account_key] = PublicKey.findProgramAddressSync(
          [Buffer.from(VOTE_DATA_ACCOUNT_KEY), vote_account_key.toBuffer()],
          INGL_PROGRAM_ID
        );
        const inglVoteAccount = await this.connection.getAccountInfo(
          ingl_vote_data_account_key
        );
        if (inglVoteAccount) {
          this.logger.log('New Vote Account');
          await broadcastEvent(
            'New Vote Account',
            `Hey guys, a new vote accunt has been created. Go vote on app.ingl.io/dao`
          );
          fs.writeFileSync('./data.json', JSON.stringify(globalGemsData));
        }
      }

      const [proposal_pubkey] = PublicKey.findProgramAddressSync(
        [
          Buffer.from(PROPOSAL_KEY),
          toBytesInt32(oldGlobalGemsData.proposal_numeration),
        ],
        INGL_PROGRAM_ID
      );
      const proposalAccountInfo = await this.connection.getAccountInfo(
        proposal_pubkey
      );
      if (proposalAccountInfo) {
        const { date_created, date_finalized } = deserializeUnchecked(
          ValidatorProposal,
          proposalAccountInfo.data
        );
        const five_second_ago =
          new Date().setSeconds(new Date().getSeconds() - 5) / 1000;
        const five_second_after =
          new Date().setSeconds(new Date().getSeconds() + 5) / 1000;

        if (
          five_second_ago < date_created &&
          date_created < five_second_after
        ) {
          this.logger.log('New Proposal');
          await broadcastEvent(
            'New Proposal',
            `Hey guys, a new proposal has just been created. check it out at app.ingl.io/dao`
          );
        }
        if (
          five_second_ago < date_finalized &&
          date_finalized < five_second_after
        ) {
          this.logger.log('Proposal Finalyze');
          await broadcastEvent(
            'Proposal Finalyze',
            `Hey guys, the ongoing proposal has just been finalyze. Get ready to vote a new one would sone be created`
          );
        }
      }
    } catch (err) {
      console.log(err);
      return;
    }
  }
}
