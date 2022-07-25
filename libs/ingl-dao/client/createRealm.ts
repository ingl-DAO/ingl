import {
  CreateMintGovernanceArgs,
  getGovernanceProgramVersion,
  Governance,
  GovernanceConfig,
  GOVERNANCE_PROGRAM_SEED,
  GOVERNANCE_SCHEMA,
  SetRealmAuthorityAction,
  SYSTEM_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  VoteThresholdPercentage,
  VoteTipping,
  withCreateTokenOwnerRecord,
  withSetRealmAuthority,
} from '@solana/spl-governance';

import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { AnchorProvider, BN, Wallet } from '@project-serum/anchor';
import { serialize } from 'borsh';
import { WalletSigner } from './utils/sendTransactions';
import { getTimestampFromDays } from './utils/helpers';
import { nftPluginsPks } from './utils/plugin/useVotingPlugins';

import {
  getVoterWeightRecord,
  getMaxVoterWeightRecord,
  getRegistrarPDA,
} from './utils/plugin/accounts';
import { NftVoterClient } from '@solana/governance-program-library';

import {
  GOVERNANCE_PROGRAM_CONFIG_SEED,
  INGL_GOVERNANCE_PROGRAM_ID,
  INGL_REALM_NAME,
  MINT_GOVERNANCE_SEED,
  NATIVE_TREASURY_SEED,
} from './utils/state';
import Payer from './keypair';
interface NFTRealm {
  connection: Connection;
  wallet: WalletSigner;
  programIdAddress: string;

  realmName: string;
  collectionAddress: string;
  collectionCount: number;
  tokensToGovernThreshold: number | undefined;

  communityYesVotePercentage: number;
  existingCommunityMintPk: PublicKey | undefined;
  // communityMintSupplyFactor: number | undefined

  createCouncil: boolean;
  existingCouncilMintPk: PublicKey | undefined;
  transferCouncilMintAuthority: boolean | undefined;
  councilWalletPks: PublicKey[];
}

export default async function createNFTRealm({
  connection,
  wallet,
  collectionAddress,
  collectionCount,
  communityYesVotePercentage,
}: // communityMintSupplyFactor: rawCMSF,
NFTRealm) {
  const INGL_GOVERNANCE_PROGRAM_PUBKEY = new PublicKey(
    INGL_GOVERNANCE_PROGRAM_ID
  );
  const [realmPDA] = await PublicKey.findProgramAddress(
    [Buffer.from(GOVERNANCE_PROGRAM_SEED), Buffer.from(INGL_REALM_NAME)],
    INGL_GOVERNANCE_PROGRAM_PUBKEY
  );
  const communityTokenMint = new Keypair();
  const [communityTokenHoldingPDA] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      realmPDA.toBuffer(),
      communityTokenMint.publicKey.toBuffer(),
    ],
    INGL_GOVERNANCE_PROGRAM_PUBKEY
  );
  const [communityMintGovernancePDA] = await PublicKey.findProgramAddress(
    [
      Buffer.from(MINT_GOVERNANCE_SEED),
      realmPDA.toBuffer(),
      communityTokenMint.publicKey.toBuffer(),
    ],
    INGL_GOVERNANCE_PROGRAM_PUBKEY
  );
  const councilTokenMint = new Keypair();
  const [councilMintGovernancePDA] = await PublicKey.findProgramAddress(
    [
      Buffer.from(MINT_GOVERNANCE_SEED),
      realmPDA.toBuffer(),
      councilTokenMint.publicKey.toBuffer(),
    ],
    INGL_GOVERNANCE_PROGRAM_PUBKEY
  );
  const payerKeypair = Keypair.fromSecretKey(new Uint8Array(Payer));
  const payerCouncilAssosiatedPDA = await getAssociatedTokenAddress(
    councilTokenMint.publicKey,
    payerKeypair.publicKey,
    true,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID
  );
  const [realmConfigPDA] = await PublicKey.findProgramAddress(
    [Buffer.from(GOVERNANCE_PROGRAM_CONFIG_SEED), Buffer.from(INGL_REALM_NAME)],
    INGL_GOVERNANCE_PROGRAM_PUBKEY
  );

  const realmAuthority = payerKeypair;
  const [councilTokenHoldingPDA] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      realmPDA.toBuffer(),
      councilTokenMint.publicKey.toBuffer(),
    ],
    INGL_GOVERNANCE_PROGRAM_PUBKEY
  );
  const [communityNativeTreasuryPDA] = await PublicKey.findProgramAddress(
    [Buffer.from(NATIVE_TREASURY_SEED), communityMintGovernancePDA.toBuffer()],
    INGL_GOVERNANCE_PROGRAM_PUBKEY
  );
  const communityVoterWeightAddin = new PublicKey(nftPluginsPks[0]);
  const maxCommunityVoterWeightAddin = new PublicKey(nftPluginsPks[0]);
  const [payerCouncilTokenRecordPDA] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      realmPDA.toBuffer(),
      councilTokenMint.publicKey.toBuffer(),
      payerKeypair.publicKey.toBuffer(),
    ],
    INGL_GOVERNANCE_PROGRAM_PUBKEY
  );

  const maxVotingTimeInDays = 3;
  const minCommunityTokensToCreateProposal = 1;
  const minCouncilTokensToCreateProposal = 1;
  const programVersion = await getGovernanceProgramVersion(
    connection,
    INGL_GOVERNANCE_PROGRAM_PUBKEY
  );

  let keys = [
    {
      pubkey: realmPDA,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: realmAuthority.publicKey,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: realmConfigPDA,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: payerKeypair.publicKey,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: payerCouncilAssosiatedPDA,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: payerCouncilTokenRecordPDA,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: communityTokenMint.publicKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: communityTokenHoldingPDA,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: communityMintGovernancePDA,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: communityNativeTreasuryPDA,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: communityVoterWeightAddin,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: councilTokenMint.publicKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: councilTokenHoldingPDA,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: councilMintGovernancePDA,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: PublicKey.default,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: SYSTEM_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    // {
    //   pubkey: Governance,
    //   isSigner: false,
    //   isWritable: false,
    // },
  ];

  const config = new GovernanceConfig({
    voteThresholdPercentage: new VoteThresholdPercentage({
      value: communityYesVotePercentage,
    }),
    minCommunityTokensToCreateProposal: new BN(
      minCommunityTokensToCreateProposal
    ),
    minInstructionHoldUpTime: 0,
    maxVotingTime: getTimestampFromDays(maxVotingTimeInDays),
    voteTipping: VoteTipping.Strict,
    proposalCoolOffTime: 0,
    minCouncilTokensToCreateProposal: new BN(minCouncilTokensToCreateProposal),
  });

  const args = new CreateMintGovernanceArgs({
    config,
    transferMintAuthorities: true,
  });
  let createRealmInstruction = new TransactionInstruction({
    keys,
    programId: INGL_GOVERNANCE_PROGRAM_PUBKEY,
    data: Buffer.from([0, ...serialize(GOVERNANCE_SCHEMA, args)]),
  });
  const options = AnchorProvider.defaultOptions();
  const provider = new AnchorProvider(connection, wallet as Wallet, options);
  const nftClient = await NftVoterClient.connect(provider);

  const { registrar } = await getRegistrarPDA(
    realmPDA,
    communityTokenMint.publicKey,
    nftClient!.program.programId
  );
  const instructionCR = await nftClient!.program.methods
    .createRegistrar(10) // Max collections
    .accounts({
      registrar,
      realm: realmPDA,
      governanceProgramId: INGL_GOVERNANCE_PROGRAM_PUBKEY,
      // realmAuthority: communityMintGovPk,
      realmAuthority: payerKeypair.publicKey,
      governingTokenMint: communityTokenMint.publicKey,
      payer: payerKeypair.publicKey,
      systemProgram: SYSTEM_PROGRAM_ID,
    })
    .instruction();

  const { maxVoterWeightRecord } = await getMaxVoterWeightRecord(
    realmPDA,
    communityTokenMint.publicKey,
    nftClient!.program.programId
  );
  const instructionMVWR = await nftClient!.program.methods
    .createMaxVoterWeightRecord()
    .accounts({
      maxVoterWeightRecord,
      governanceProgramId: INGL_GOVERNANCE_PROGRAM_PUBKEY,
      realm: realmPDA,
      realmGoverningTokenMint: communityTokenMint.publicKey,
      payer: payerKeypair.publicKey,
      systemProgram: SYSTEM_PROGRAM_ID,
    })
    .instruction();

  const instructionCC = await nftClient!.program.methods
    .configureCollection(
      new BN(minCommunityTokensToCreateProposal),
      collectionCount
    )
    .accounts({
      registrar,
      realm: realmPDA,
      // realmAuthority: communityMintGovPk,
      realmAuthority: payerKeypair.publicKey,
      collection: new PublicKey(collectionAddress),
      maxVoterWeightRecord: maxVoterWeightRecord,
    })
    .instruction();

  const instructions: TransactionInstruction[] = [
    createRealmInstruction,
    instructionCR,
    instructionMVWR,
    instructionCC,
  ];

  // Set the community governance as the realm authority
  withSetRealmAuthority(
    instructions,
    INGL_GOVERNANCE_PROGRAM_PUBKEY,
    programVersion,
    realmPDA,
    payerKeypair.publicKey,
    communityMintGovernancePDA,
    SetRealmAuthorityAction.SetChecked
  );

  const { voterWeightPk } = await getVoterWeightRecord(
    realmPDA,
    communityTokenMint.publicKey,
    payerKeypair.publicKey,
    nftClient.program.programId
  );

  const createVoterWeightRecord = await nftClient.program.methods
    .createVoterWeightRecord(payerKeypair.publicKey)
    .accounts({
      voterWeightRecord: voterWeightPk,
      governanceProgramId: INGL_GOVERNANCE_PROGRAM_PUBKEY,
      realm: realmPDA,
      realmGoverningTokenMint: communityTokenMint.publicKey,
      payer: payerKeypair.publicKey,
      systemProgram: SYSTEM_PROGRAM_ID,
    })
    .instruction();

  instructions.push(createVoterWeightRecord);
  await withCreateTokenOwnerRecord(
    instructions,
    INGL_GOVERNANCE_PROGRAM_PUBKEY,
    realmPDA,
    payerKeypair.publicKey,
    communityTokenMint.publicKey,
    payerKeypair.publicKey
  );

  try {
    const tx = new Transaction();
    for (let i = 0; i < instructions.length; i++) {
      const element = instructions[i];
      tx.add(element);
    }
    // tx.feePayer = payerKeypair.publicKey
    // const blockhashObj = await connection.getLatestBlockhash();
    // tx.recentBlockhash = await blockhashObj.blockhash;
    // tx.sign(...[communityTokenMint, councilTokenMint]);
    // const signedTransaction = wallet.signTransaction
    //   ? await wallet?.signTransaction(tx)
    //   : null;
    // const txn = signedTransaction?.serialize();

    const transactionId = await sendAndConfirmTransaction(connection, tx, [
      communityTokenMint,
      councilTokenMint,
    ]);

    return transactionId;
  } catch (error) {
    throw new Error('' + error);
  }
  //   try {
  //     console.log('CREATE NFT REALM: sending transactions')
  //     const tx = await sendTransactionsV2({
  //       connection,
  //       showUiComponent: true,
  //       wallet,
  //       signersSet: [
  //         [communityTokenMint, councilTokenMint],
  //         [],
  //       ],
  //       TransactionInstructions: [
  //         createRealmInstruction,
  //         nftConfigurationInstructions,
  //       ].map((x) =>
  //         transactionInstructionsToTypedInstructionsSets(
  //           x,
  //           SequenceType.Sequential
  //         )
  //       ),
  //     })

  //     return tx

  //   } catch (ex) {
  //     console.error(ex)
  //     throw ex
  //   }
}
