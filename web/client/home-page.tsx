import * as React from 'react';
import {RouteComponentProps} from 'react-router-dom';

import {IWeb3Window, contracts} from './chain';
declare const window: IWeb3Window;

export enum IGameState {
    none,
    player1WaitingForMove,
    playerWaitingForAddress,
    player2WaitingForMove,
    player1WaitingForTimeoutOrSolve
}

export enum IMove {Null, Rock, Paper, Scissors, Spock, Lizard};

export interface IState {
    gameState: IGameState;
    stake: number;
    player2address: string;
    contractAddress: string;
}

export default class HomePage extends React.Component<RouteComponentProps<any>, IState> {
    constructor(){
        super();
        this.state = {
            gameState: IGameState.none,
            stake: 0,
            player2address: '',
            contractAddress: ''
        }
        this.update();
    }
    private async update(){
    }
    static genRandomNumber(min = 0, max = 999999999){
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    get salt(){
        return Number(window.localStorage.getItem('salt'));
    }
    set salt(newSalt: number){
        window.localStorage.setItem('salt', newSalt.toString());
    }
    async startGame(move: IMove){
        this.salt = HomePage.genRandomNumber();
        const hash = await contracts.Hasher.hash(move, this.salt) as string;
        const value = window.web3.toBigNumber(window.web3.toWei(this.state.stake, 'ether'));
        const contract = await contracts.RPS.new(hash, this.state.player2address, {from: window.web3.eth.coinbase, value});
        this.setState({contractAddress: contract.address});
    }
    async playGame(move: IMove){
        const RPS = contracts.RPS.at(this.state.contractAddress);
        const value = RPS.stake.call() as BigNumber.BigNumber;
        const res = await RPS.play(move, {from: window.web3.eth.coinbase, value});
    }
    public render(){
        switch(this.state.gameState){
            case IGameState.none:
                return (
                    <div className="home-page">
                        <h2>Welcome to</h2>
                        <h1>RPS</h1>

                        <button onClick={() => {
                            this.setState({gameState: IGameState.player1WaitingForMove});
                        }}>Start a New Game</button><br/>
                        or<br/>
                        <button onClick={() => {
                            this.setState({gameState: IGameState.playerWaitingForAddress});
                        }}>Join a Game</button>
                    </div>
                );
            case IGameState.player1WaitingForMove:
                const playDisabled = this.state.player2address && this.state.stake ? false : true;
                return (
                    <div className="home-page">
                        <h2>Welcome to</h2>
                        <h1>RPS</h1>

                        Address of Second Player: <input type="text" value={this.state.player2address} onChange={(event) => {
                            this.setState({player2address: event.target.value});
                        }}/><br />
                        Stake: <input type="number" value={this.state.stake} onChange={(event) => {
                            this.setState({stake: Number(event.target.value)});
                        }}/> Eth<br />

                        <button disabled={playDisabled} onClick={async () => {
                            await this.startGame(IMove.Rock);
                        }}>Rock</button>
                        <button disabled={playDisabled} onClick={async () => {
                            await this.startGame(IMove.Paper);
                        }}>Paper</button>
                        <button disabled={playDisabled} onClick={async () => {
                            await this.startGame(IMove.Scissors);
                        }}>Scissors</button>
                        <button disabled={playDisabled} onClick={async () => {
                            await this.startGame(IMove.Spock);
                        }}>Spock</button>
                        <button disabled={playDisabled} onClick={async () => {
                            await this.startGame(IMove.Lizard);
                        }}>Lizard</button>
                        <br />
                        {this.state.contractAddress ? `The address of the game is "${this.state.contractAddress}" the se.` : ``}
                    </div>
                );
            case IGameState.playerWaitingForAddress:
                return (
                    <div className="home-page">
                        <h2>Welcome to</h2>
                        <h1>RPS</h1>
                        Address of Game: <input type="text" value={this.state.contractAddress} onChange={(event) => {
                            this.setState({contractAddress: event.target.value});
                        }}/>
                        <button onClick={async () => {
                            const RPS = contracts.RPS.at(this.state.contractAddress);
                            const j2 = await  RPS.j2.call();
                            const j1 = await  RPS.j1.call();
                            if(j2 === window.web3.eth.coinbase){
                                this.setState({gameState: IGameState.player2WaitingForMove});
                            }
                            else if(j2 === window.web3.eth.coinbase){
                                this.setState({gameState: IGameState.player1WaitingForTimeoutOrSolve});
                            }                            
                        }}>Join Game</button>
                    </div>
                );
            case IGameState.player2WaitingForMove:
                return (
                    <div className="home-page">
                        <h2>Welcome to</h2>
                        <h1>RPS</h1>
                        <button onClick={async () => {
                            await this.playGame(IMove.Rock);
                        }}>Rock</button>
                        <button onClick={async () => {
                            await this.playGame(IMove.Paper);
                        }}>Paper</button>
                        <button onClick={async () => {
                            await this.playGame(IMove.Scissors);
                        }}>Scissors</button>
                        <button onClick={async () => {
                            await this.playGame(IMove.Spock);
                        }}>Spock</button>
                        <button onClick={async () => {
                            await this.playGame(IMove.Lizard);
                        }}>Lizard</button>

                    </div>
                );
                
                
            default:
                return;
        }
    }
}
