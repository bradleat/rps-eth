/// <reference path="../node_modules/web3-typescript-typings/index.d.ts" />
import * as Web3 from 'web3';
import * as contract from 'truffle-contract';
const {RPS, Hasher} = require('rps-blockchain');

export interface IWeb3Window extends Window {
    web3: Web3
}
declare const window: IWeb3Window;
let contracts: {RPS: any, Hasher: any};

export async function getContracts(){
    if(contracts){
        return {
            contracts
        };
    }
    else {
        const RPSContract = contract(RPS);
        RPSContract.setProvider(window.web3.currentProvider);
        // const RPSAddress = RPS.networks[Object.keys(RPS.networks)[0]].address;
        // const RPSOnChain = await RPSContract.at(RPSAddress);

        const HasherContract = contract(Hasher);
        HasherContract.setProvider(window.web3.currentProvider);
        // const HasherAddress = "0xb2b1c92f73525d467c036a1f4bec146db4e44c1c";
        const HasherAddress = Hasher.networks[Object.keys(Hasher.networks)[0]].address;
        const HasherOnChain = await HasherContract.at(HasherAddress);

        contracts = {
            RPS: RPSContract,
            // Hasher: null
            Hasher: HasherOnChain
        };

        return contracts;
    }
}

export {contracts};
