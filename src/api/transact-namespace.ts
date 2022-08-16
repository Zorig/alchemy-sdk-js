import { AlchemyConfig } from './alchemy-config';
import {
  GasStationPrice,
  SendPrivateTransactionOptions,
  SendRawTransactionResponse
} from '../types/types';
import { fromHex, toHex } from './util';
import {
  TransactionReceipt,
  TransactionRequest,
  TransactionResponse
} from '@ethersproject/abstract-provider';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Deferrable } from '@ethersproject/properties';
import type { BigNumber } from '@ethersproject/bignumber';
import { Wallet } from './alchemy-wallet';

export class TransactNamespace {
  constructor(private readonly config: AlchemyConfig) {}

  /**
   * Used to send a single transaction to Flashbots. Flashbots will attempt to
   * send the transaction to miners for the next 25 blocks.
   *
   * Returns the transaction hash of the submitted transaction.
   *
   * @param signedTransaction The raw, signed transaction as a hash.
   * @param maxBlockNumber Optional hex-encoded number string. Highest block
   *   number in which the transaction should be included.
   * @param options Options to configure the request.
   */
  async sendPrivateTransaction(
    signedTransaction: string,
    maxBlockNumber?: number,
    options?: SendPrivateTransactionOptions
  ): Promise<string> {
    const provider = await this.config.getProvider();
    const hexBlockNumber = maxBlockNumber ? toHex(maxBlockNumber) : undefined;
    return provider._send(
      'eth_sendPrivateTransaction',
      [
        {
          tx: signedTransaction,
          maxBlockNumber: hexBlockNumber,
          preferences: options
        }
      ],
      'sendPrivateTransaction'
    );
  }

  /**
   * Stops the provided private transaction from being submitted for future
   * blocks. A transaction can only be cancelled if the request is signed by the
   * same key as the {@link sendPrivateTransaction} call submitting the
   * transaction in first place.
   *
   * Please note that fast mode transactions cannot be cancelled using this method.
   *
   * Returns a boolean indicating whether the cancellation was successful.
   *
   * @param transactionHash Transaction hash of private tx to be cancelled
   */
  async cancelPrivateTransaction(transactionHash: string): Promise<boolean> {
    const provider = await this.config.getProvider();
    return provider._send(
      'eth_cancelPrivateTransaction',
      [
        {
          txHash: transactionHash
        }
      ],
      'cancelPrivateTransaction'
    );
  }

  /**
   * Returns the transaction with hash or null if the transaction is unknown.
   *
   * If a transaction has not been mined, this method will search the
   * transaction pool. Various backends may have more restrictive transaction
   * pool access (e.g. if the gas price is too low or the transaction was only
   * recently sent and not yet indexed) in which case this method may also return null.
   *
   * NOTE: This is an alias for {@link CoreNamespace.getTransaction}.
   *
   * @param transactionHash The hash of the transaction to get.
   * @public
   */
  async getTransaction(
    transactionHash: string | Promise<string>
  ): Promise<TransactionResponse | null> {
    const provider = await this.config.getProvider();
    return provider.getTransaction(transactionHash);
  }

  /**
   * Submits transaction to the network to be mined. The transaction must be
   * signed, and be valid (i.e. the nonce is correct and the account has
   * sufficient balance to pay for the transaction).
   *
   * NOTE: This is an alias for {@link CoreNamespace.sendTransaction}.
   *
   * @param signedTransaction The signed transaction to send.
   * @public
   */
  async sendTransaction(
    signedTransaction: string | Promise<string>
  ): Promise<TransactionResponse> {
    const provider = await this.config.getProvider();
    return provider.sendTransaction(signedTransaction);
  }

  /**
   * Returns an estimate of the amount of gas that would be required to submit
   * transaction to the network.
   *
   * An estimate may not be accurate since there could be another transaction on
   * the network that was not accounted for, but after being mined affects the
   * relevant state.
   *
   * This is an alias for {@link CoreNamespace.estimateGas}.
   *
   * @param transaction The transaction to estimate gas for.
   * @public
   */
  async estimateGas(
    transaction: Deferrable<TransactionRequest>
  ): Promise<BigNumber> {
    const provider = await this.config.getProvider();
    return provider.estimateGas(transaction);
  }

  /**
   * Returns a fee per gas (in wei) that is an estimate of how much you can pay
   * as a priority fee, or "tip", to get a transaction included in the current block.
   *
   * This number is generally used to set the `maxPriorityFeePerGas` field in a
   * transaction request.
   *
   * @public
   */
  async getMaxPriorityFeePerGas(): Promise<number> {
    const provider = await this.config.getProvider();
    const feeHex = await provider._send(
      'eth_maxPriorityFeePerGas',
      [],
      'getMaxPriorityFeePerGas'
    );
    return fromHex(feeHex);
  }

  /**
   * Submits a series of signed transaction to Alchemy's nodes.
   *
   * @param signedTransactions
   */
  async sendReinforcedTransaction(
    signedTransactions: string[]
  ): Promise<SendRawTransactionResponse> {
    const provider = await this.config.getProvider();
    return provider._send(
      'alchemy_sendRawTransaction',
      [
        {
          serializedTransactions: signedTransactions
        }
      ],
      'sendReinforcedTransaction'
    );
  }

  /**
   * @param transaction
   * @param wallet
   */
  async sendAutoReinforcedTransaction(
    transaction: TransactionRequest,
    wallet: Wallet
  ): Promise<SendRawTransactionResponse> {
    let gasLimit;
    let priorityFee;
    try {
      gasLimit = await this.estimateGas(transaction);
      priorityFee = await this.getMaxPriorityFeePerGas();
    } catch (e) {
      throw new Error(`Failed to estimate gas for transaction: ${e}`);
    }

    const signedTransactions = await signGasTransactions(
      transaction,
      gasLimit,
      priorityFee,
      wallet
    );

    return this.sendReinforcedTransaction(signedTransactions);
  }

  /**
   * Returns a promise which will not resolve until specified transaction hash is mined.
   *
   * If {@link confirmations} is 0, this method is non-blocking and if the
   * transaction has not been mined returns null. Otherwise, this method will
   * block until the transaction has confirmed blocks mined on top of the block
   * in which it was mined.
   *
   * NOTE: This is an alias for {@link CoreNamespace.waitForTransaction}.
   *
   * @param transactionHash The hash of the transaction to wait for.
   * @param confirmations The number of blocks to wait for.
   * @param timeout The maximum time to wait for the transaction to confirm.
   * @public
   */
  async waitForTransaction(
    transactionHash: string,
    confirmations?: number,
    timeout?: number
  ): Promise<TransactionReceipt | null> {
    const provider = await this.config.getProvider();
    return provider.waitForTransaction(transactionHash, confirmations, timeout);
  }

  /**
   * Returns the current recommended fast, standard and safe low gas prices on
   * the Ethereum network, along with the current block and wait times for each "speed".
   *
   * This endpoint is powered by the .EthGasStation API. See
   * {@link https://docs.ethgasstation.info/gas-price)} for more information.
   *
   * @param apiKey Optional API key to use for the request. An API key is not
   *   required, but you may get rate limited at higher request volumes. To
   *   obtain an api key, visit EthGasStation.
   */
  async ethGasStationPrice(apiKey?: string): Promise<GasStationPrice> {
    let gasUrl = 'https://ethgasstation.info/api/ethgasAPI.json';
    gasUrl = apiKey ? `${gasUrl}?api-key=${apiKey}` : gasUrl;
    const config: AxiosRequestConfig = {
      method: 'get',
      url: gasUrl
    };
    const response: AxiosResponse<GasStationPrice> = await axios(config);
    return response.data;
  }
}

/**
 * Helper method to sign the raw transaction with the given gas limit and
 * priority fee across a spread of different gas prices.
 */
async function signGasTransactions(
  transaction: TransactionRequest,
  gasLimit: BigNumber,
  priorityFee: number,
  wallet: Wallet
): Promise<string[]> {
  const signedTransactions = [];
  const multipliers = [0.9, 1, 1.1, 1.2, 1.3];
  for (const feeMultiplier of multipliers) {
    const txWithGas = {
      ...transaction,
      gasLimit: gasLimit.toNumber(),
      maxPriorityFeePerGas: Math.round(feeMultiplier * priorityFee)
    };
    console.log(txWithGas);
    const signedTx = await wallet.signTransaction(txWithGas);
    signedTransactions.push(signedTx);
  }
  console.log(signedTransactions);

  return signedTransactions;
}
