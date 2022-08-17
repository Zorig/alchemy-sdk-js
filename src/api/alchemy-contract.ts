import {
  Contract as EthersContract,
  BaseContract as EthersBaseContract,
  ContractFactory as EthersContractFactory
} from '@ethersproject/contracts';

export class Contract extends EthersContract {}

export class BaseContract extends EthersBaseContract {}

export class ContractFactory extends EthersContractFactory {}
