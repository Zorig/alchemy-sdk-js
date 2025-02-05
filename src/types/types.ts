import {
  EventType,
  TransactionReceipt
} from '@ethersproject/abstract-provider';
import { BaseNft, Nft } from '../api/nft';

// TODO: separate this file into other files.

/**
 * Options object used to configure the Alchemy SDK.
 *
 * @public
 */
export interface AlchemySettings {
  /** The Alchemy API key that can be found in the Alchemy dashboard. */
  apiKey?: string;

  /**
   * The name of the network. Once configured, the network cannot be changed. To
   * use a different network, instantiate a new `Alchemy` instance
   */
  network?: Network;

  /** The maximum number of retries to attempt if a request fails. Defaults to 5. */
  maxRetries?: number;

  /**
   * Optional URL endpoint to use for all requests. Setting this field will
   * override the URL generated by the {@link network} and {@link apiKey} fields.
   *
   * This field is useful for testing or for using a custom node endpoint. Note
   * that not all methods will work with custom URLs.
   */
  url?: string;
}

/**
 * The supported networks by Alchemy. Note that some functions are not available
 * on all networks. Please refer to the Alchemy documentation for which APIs are
 * available on which networks
 * {@link https://docs.alchemy.com/alchemy/apis/feature-support-by-chain}
 *
 * @public
 */
export enum Network {
  ETH_MAINNET = 'eth-mainnet',
  ETH_ROPSTEN = 'eth-ropsten',
  ETH_GOERLI = 'eth-goerli',
  ETH_KOVAN = 'eth-kovan',
  ETH_RINKEBY = 'eth-rinkeby',
  OPT_MAINNET = 'opt-mainnet',
  OPT_KOVAN = 'opt-kovan',
  OPT_GOERLI = 'opt-goerli',
  ARB_MAINNET = 'arb-mainnet',
  ARB_RINKEBY = 'arb-rinkeby',
  ARB_GOERLI = 'arb-goerli',
  MATIC_MAINNET = 'polygon-mainnet',
  MATIC_MUMBAI = 'polygon-mumbai',
  ASTAR_MAINNET = 'astar-mainnet'
}

/** @public */
export interface TokenBalancesResponse {
  address: string;
  tokenBalances: TokenBalance[];
}

/** @public */
export type TokenBalance = TokenBalanceSuccess | TokenBalanceFailure;

/** @public */
export interface TokenBalanceSuccess {
  contractAddress: string;
  tokenBalance: string;
  error: null;
}

/** @public */
export interface TokenBalanceFailure {
  contractAddress: string;
  tokenBalance: null;
  error: string;
}

/** @public */
export interface TokenMetadataResponse {
  decimals: number | null;
  logo: string | null;
  name: string | null;
  symbol: string | null;
}

/** @public */
export interface AssetTransfersParams {
  fromBlock?: string;
  toBlock?: string;
  order?: AssetTransfersOrder;
  fromAddress?: string;
  toAddress?: string;
  contractAddresses?: string[];
  excludeZeroValue?: boolean;
  maxCount?: number;
  category: AssetTransfersCategory[];
  pageKey?: string;
  withMetadata?: boolean;
}

/** @public */
export enum AssetTransfersCategory {
  EXTERNAL = 'external',
  INTERNAL = 'internal',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155',

  /**
   * Special contracts that don't follow ERC 721/1155, (ex: CryptoKitties).
   *
   * @beta
   */
  SPECIALNFT = 'specialnft'
}

/** @public */
export enum AssetTransfersOrder {
  ASCENDING = 'asc',
  DESCENDING = 'desc'
}

/** @public */
export enum NftTokenType {
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155',
  UNKNOWN = 'UNKNOWN'
}

/** @public */
export interface AssetTransfersResponse {
  transfers: AssetTransfersResult[];
  pageKey?: string;
}

/** @public */
export interface AssetTransfersResult {
  category: AssetTransfersCategory;
  blockNum: string;
  from: string;
  to: string | null;
  value: number | null;
  erc721TokenId: string | null;
  erc1155Metadata: ERC1155Metadata[] | null;
  tokenId: string | null;
  asset: string | null;
  hash: string;
  rawContract: RawContract;
  metadata?: AssetTransfersMetadata;
}

/** @public */
export interface AssetTransfersMetadata {
  blockTimestamp: string;
}

/**
 * Represents NFT metadata that holds fields. Note that since there is no
 * standard metadata format, the fields are not guaranteed to be present.
 *
 * @public
 */
export interface NftMetadata extends Record<string, any> {
  /** Name of the NFT asset. */
  name?: string;

  /** A human-readable description of the NFT asset. */
  description?: string;

  /** URL to the NFT asset image. */
  image?: string;

  /**
   * The image URL that appears along the top of the NFT asset page. This tends
   * to be the highest resolution image.
   */
  external_url?: string;

  /** Background color of the NFT item. Usually defined as a 6 character hex string. */
  background_color?: string;

  /** The traits, attributes, and characteristics for the NFT asset. */
  attributes?: Array<Record<string, any>>;
}

/**
 * Represents the URI information the NFT's metadata.
 *
 * @public
 */
export interface TokenUri {
  /**
   * URI for the location of the NFT's original metadata blob (ex: the original
   * IPFS link).
   */
  raw: string;

  /** Public gateway URI for the raw URI. Generally offers better performance. */
  gateway: string;
}

/**
 * Represents the URI information for the NFT's media assets.
 *
 * @public
 */
export interface Media {
  /**
   * URI for the location of the NFT's original metadata blob for media (ex: the
   * original IPFS link).
   */
  raw: string;

  /** Public gateway URI for the raw URI. Generally offers better performance. */
  gateway: string;

  /** URL for a resized thumbnail of the NFT media asset. */
  thumbnail?: string;

  /**
   * The media format (ex: jpg, gif, png) of the {@link gateway} and
   * {@link thumbnail} assets.
   */
  format?: string;
}

/**
 * Optional parameters object for the {@link getNftsForOwner} and
 * {@link getNftsForOwnerIterator} functions.
 *
 * This interface is used to fetch NFTs with their associated metadata. To get
 * Nfts without their associated metadata, use {@link GetBaseNftsForOwnerOptions}.
 *
 * @public
 */
export interface GetNftsForOwnerOptions {
  /**
   * Optional page key from an existing {@link OwnedBaseNftsResponse} or
   * {@link OwnedNftsResponse}to use for pagination.
   */
  pageKey?: string;

  /** Optional list of contract addresses to filter the results by. Limit is 20. */
  contractAddresses?: string[];

  /**
   * Optional list of filters applied to the query. NFTs that match one or more
   * of these filters are excluded from the response.
   */
  excludeFilters?: NftExcludeFilters[];

  /**
   * Sets the total number of NFTs to return in the response. Defaults to 100.
   * Maximum page size is 100.
   */
  pageSize?: number;

  /** Optional boolean flag to omit NFT metadata. Defaults to `false`. */
  omitMetadata?: boolean;
}

/**
 * Optional parameters object for the {@link getNftsForOwner} and
 * {@link getNftsForOwnerIterator} functions.
 *
 * This interface is used to fetch NFTs without their associated metadata. To
 * get Nfts with their associated metadata, use {@link GetNftsForOwnerOptions}.
 *
 * @public
 */
export interface GetBaseNftsForOwnerOptions {
  /**
   * Optional page key from an existing {@link OwnedBaseNftsResponse} or
   * {@link OwnedNftsResponse}to use for pagination.
   */
  pageKey?: string;

  /** Optional list of contract addresses to filter the results by. Limit is 20. */
  contractAddresses?: string[];

  /**
   * Optional list of filters applied to the query. NFTs that match one or more
   * of these filters are excluded from the response.
   */
  excludeFilters?: NftExcludeFilters[];

  /**
   * Sets the total number of NFTs to return in the response. Defaults to 100.
   * Maximum page size is 100.
   */
  pageSize?: number;

  /** Optional boolean flag to include NFT metadata. Defaults to `false`. */
  omitMetadata: true;
}

/**
 * Enum of NFT filters that can be applied to a {@link getNftsForOwner} request.
 * NFTs that match one or more of these filters are excluded from the response.
 *
 * @beta
 */
export enum NftExcludeFilters {
  /** Exclude NFTs that have been classified as spam. */
  SPAM = 'SPAM'
}

/**
 * The response object for the {@link getNftsForOwner} and
 * {@link getNftsForOwnerIterator} functions. The object contains the NFTs with
 * metadata owned by the provided address, along with pagination information and
 * the total count.
 *
 * @public
 */
export interface OwnedNftsResponse {
  /** The NFTs owned by the provided address. */
  readonly ownedNfts: OwnedNft[];

  /**
   * Pagination token that can be passed into another request to fetch the next
   * NFTs. If there is no page key, then there are no more NFTs to fetch.
   */
  readonly pageKey?: string;

  /** The total count of NFTs owned by the provided address. */
  readonly totalCount: number;
}

/**
 * The response object for the {@link getNftsForOwner} and
 * {@link getNftsForOwnerIterator)} functions. The object contains the NFTs
 * without metadata owned by the provided address, along with pagination
 * information and the total count.
 *
 * @public
 */
export interface OwnedBaseNftsResponse {
  /** The NFTs owned by the provided address. */
  readonly ownedNfts: OwnedBaseNft[];

  /**
   * Pagination token that can be passed into another request to fetch the next
   * NFTs. If there is no page key, then there are no more NFTs to fetch.
   */
  readonly pageKey?: string;

  /** The total count of NFTs owned by the provided address. */
  readonly totalCount: number;
}

/**
 * Represents an NFT with metadata owned by an address.
 *
 * @public
 */
export interface OwnedNft extends Nft {
  /** The token balance of the NFT. */
  readonly balance: number;
}

/**
 * Represents an NFT without metadata owned by an address.
 *
 * @public
 */
export interface OwnedBaseNft extends BaseNft {
  /** The token balance of the NFT. */
  readonly balance: number;
}

/**
 * The response object for the {@link getOwnersForNft}.
 *
 * @public
 */
export interface GetOwnersForNftResponse {
  /** An array of owner addresses for the provided token. */
  readonly owners: string[];
}

/**
 * The response object for the {@link getOwnersForContract}.
 *
 * @public
 */
export interface GetOwnersForContractResponse {
  /** An array of owner addresses for the provided contract address */
  readonly owners: string[];
}

/**
 * The successful object returned by the {@link getFloorPrice} call for each
 * marketplace (e.g. looksRare).
 *
 * @public
 */
export interface FloorPriceMarketplace {
  /** The floor price of the collection on the given marketplace */
  readonly floorPrice: number;
  /** The currency in which the floor price is denominated */
  readonly priceCurrency: string;
  /** The link to the collection on the given marketplace */
  readonly collectionUrl: string;
  /** UTC timestamp of when the floor price was retrieved from the marketplace */
  readonly retrievedAt: string;
}

/**
 * The failing object returned by the {@link getFloorPrice} call for each
 * marketplace (e.g. looksRare).
 *
 * @public
 */
export interface FloorPriceError {
  /** Error fetching floor prices from the given marketplace */
  readonly error: string;
}

/**
 * The response object for the {@link getFloorPrice} method.
 *
 * @public
 */
export interface GetFloorPriceResponse {
  /**
   * Name of the NFT marketplace where the collection is listed. Current
   * marketplaces supported: OpenSea, LooksRare
   */
  readonly openSea: FloorPriceMarketplace | FloorPriceError;
  readonly looksRare: FloorPriceMarketplace | FloorPriceError;
}

/** The refresh result response object returned by {@link refreshContract}. */
export interface RefreshContractResult {
  /** The NFT contract address that was passed in to be refreshed. */
  contractAddress: string;

  /** The current state of the refresh request. */
  refreshState: RefreshState;

  /**
   * Percentage of tokens currently refreshed, represented as an integer string.
   * Field can be null if the refresh has not occurred.
   */
  progress: string | null;
}

/** The current state of the NFT contract refresh process. */
export enum RefreshState {
  /** The provided contract is not an NFT or does not contain metadata. */
  DOES_NOT_EXIST = 'does_not_exist',

  /** The contract has already been queued for refresh. */
  ALREADY_QUEUED = 'already_queued',

  /** The contract is currently being refreshed. */
  IN_PROGRESS = 'in_progress',

  /** The contract refresh is complete. */
  FINISHED = 'finished',

  /** The contract refresh has been queued and await execution. */
  QUEUED = 'queued',

  /** The contract was unable to be queued due to an internal error. */
  QUEUE_FAILED = 'queue_failed'
}

/** @public */
export interface TransactionReceiptsBlockNumber {
  blockNumber: string;
}

/** @public */
export interface TransactionReceiptsBlockHash {
  blockHash: string;
}

/** @public */
export type TransactionReceiptsParams =
  | TransactionReceiptsBlockNumber
  | TransactionReceiptsBlockHash;

/** @public */
export interface TransactionReceiptsResponse {
  receipts: TransactionReceipt[] | null;
}

/** @public */
export interface ERC1155Metadata {
  tokenId: string;
  value: string;
}

/** @public */
export interface RawContract {
  value: string | null;
  address: string | null;
  decimal: string | null;
}

/**
 * Optional parameters object for the {@link getNftsForContract} and
 * {@link getNftsForContractIterator} functions.
 *
 * This interface is used to fetch NFTs with their associated metadata. To get
 * Nfts without their associated metadata, use {@link GetBaseNftsForContractOptions}.
 *
 * @public
 */
export interface GetNftsForContractOptions {
  /**
   * Optional page key from an existing {@link NftContractBaseNftsResponse} or
   * {@link NftContractNftsResponse}to use for pagination.
   */
  pageKey?: string;

  /** Optional boolean flag to omit NFT metadata. Defaults to `false`. */
  omitMetadata?: boolean;

  /**
   * Sets the total number of NFTs to return in the response. Defaults to 100.
   * Maximum page size is 100.
   */
  pageSize?: number;
}

/**
 * Optional parameters object for the {@link getNftsForContract} and
 * {@link getNftsForContractIterator} functions.
 *
 * This interface is used to fetch NFTs without their associated metadata. To
 * get Nfts with their associated metadata, use {@link GetNftsForContractOptions}.
 *
 * @public
 */
export interface GetBaseNftsForContractOptions {
  /**
   * Optional page key from an existing {@link NftContractBaseNftsResponse} or
   * {@link NftContractNftsResponse}to use for pagination.
   */
  pageKey?: string;

  /** Optional boolean flag to omit NFT metadata. Defaults to `false`. */
  omitMetadata: false;

  /**
   * Sets the total number of NFTs to return in the response. Defaults to 100.
   * Maximum page size is 100.
   */
  pageSize?: number;
}

/**
 * The response object for the {@link getNftsForContract} function. The object
 * contains the NFTs without metadata inside the NFT contract.
 *
 * @public
 */
export interface NftContractBaseNftsResponse {
  /** An array of NFTs without metadata. */
  nfts: BaseNft[];

  /**
   * Pagination token that can be passed into another request to fetch the next
   * NFTs. If there is no page key, then there are no more NFTs to fetch.
   */
  pageKey?: string;
}

/**
 * The response object for the {@link getNftsForContract} function. The object
 * contains the NFTs with metadata inside the NFT contract.
 *
 * @public
 */
export interface NftContractNftsResponse {
  /** An array of NFTs with metadata. */
  nfts: Nft[];

  /**
   * Pagination token that can be passed into another request to fetch the next
   * NFTs. If there is no page key, then there are no more NFTs to fetch.
   */
  pageKey?: string;
}

/**
 * The response object for the {@link findContractDeployer} function.
 *
 * @public
 */
export interface DeployResult {
  /** The address of the contract deployer, if it is available. */
  readonly deployerAddress?: string;

  /** The block number the contract was deployed in. */
  readonly blockNumber: number;
}

/**
 * Event filter for the {@link AlchemyWebSocketProvider.on} and
 * {@link AlchemyWebSocketProvider.once} methods to use Alchemy's custom
 * `alchemy_pendingTransactions` endpoint.
 *
 * Returns the transaction information for all pending transactions that match a
 * given filter. For full documentation, see:
 * https://docs.alchemy.com/alchemy/enhanced-apis/subscription-api-websockets#alchemy_pendingtransactions
 *
 * Note that excluding all optional parameters will return transaction
 * information for ALL pending transactions that are added to the mempool.
 *
 * @public
 */
export type AlchemyPendingTransactionsEventFilter = {
  method: 'alchemy_pendingTransactions';
  /** Filter pending transactions sent FROM the provided address or array of addresses. */
  fromAddress?: string | string[];

  /** Filter pending transactions sent TO the provided address or array of addresses. */
  toAddress?: string | string[];

  /**
   * Whether to only include transaction hashes and exclude the rest of the
   * transaction response for a smaller payload. Defaults to false (by default,
   * the entire transaction response is included).
   *
   * Note that setting only {@link hashesOnly} to true will return the same
   * response as subscribing to `newPendingTransactions`.
   */
  hashesOnly?: boolean;
};

/**
 * Alchemy's event filter that extends the default {@link EventType} interface to
 * also include Alchemy's Subscription API.
 *
 * @public
 */
export type AlchemyEventType =
  | EventType
  | AlchemyPendingTransactionsEventFilter;

/** Options for the {@link TransactNamespace.sendPrivateTransaction} method. */
export interface SendPrivateTransactionOptions {
  /**
   * Whether to use fast-mode. Defaults to false. Please note that fast mode
   * transactions cannot be cancelled using
   * {@link TransactNamespace.cancelPrivateTransaction}. method.
   *
   * See {@link https://docs.flashbots.net/flashbots-protect/rpc/fast-mode} for
   * more details.
   */
  fast: boolean;
}
