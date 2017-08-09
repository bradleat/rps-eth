import * as React from 'react';
import {RouteComponentProps} from 'react-router-dom';

import {IWeb3Window, contracts} from './chain';
declare const window: IWeb3Window;

export enum IGameState {
    none,
    player1WaitingForMove,
    playerWaitingForAddress,
    player2WaitingForMove,
    player1WaitingForTimeoutOrPlayer2,
    player2WaitingForTimeoutOrSolve,
    player1CanSolve,
    player2CanTimeout,
    player1CanTimeout,
    finished
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
    get move(){
        return Number(window.localStorage.getItem('move'));
    }
    set move(newMove: IMove){
        window.localStorage.setItem('move', newMove.toString());
    }
    async startGame(move: IMove){
        this.salt = HomePage.genRandomNumber();
        this.move = move;
        const hash = await contracts.Hasher.hash(move, this.salt) as string;
        const value = window.web3.toBigNumber(window.web3.toWei(this.state.stake, 'ether'));
        const contract = await contracts.RPS.new(hash, this.state.player2address, {from: window.web3.eth.coinbase, value});
        this.setState({contractAddress: contract.address});
    }
    async playGame(move: IMove){
        const RPS = contracts.RPS.at(this.state.contractAddress);
        const value = await RPS.stake.call() as BigNumber.BigNumber;
        const res = await RPS.play(move, {from: window.web3.eth.coinbase, value});
        this.setState({gameState: IGameState.player2WaitingForTimeoutOrSolve});        
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
                        {this.state.contractAddress ? `The address of the game is "${this.state.contractAddress}".` : ``}
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
                            const [j1, j2, c2, stake] = await Promise.all([
                                RPS.j1.call(),
                                RPS.j2.call(),
                                RPS.c2.call(),
                                RPS.stake.call()
                            ]) as [string, string, BigNumber.BigNumber, BigNumber.BigNumber];
                            if(stake.equals(0)){
                                console.log('game finished');
                            }
                            else if(IMove.Null !== c2.toNumber()){
                                if(j1 === window.web3.eth.coinbase){
                                    this.setState({gameState: IGameState.player1CanSolve});
                                } 
                                else if(j2 === window.web3.eth.coinbase){
                                    this.setState({gameState: IGameState.player2WaitingForTimeoutOrSolve});
                                }
                            }
                            else if(j2 === window.web3.eth.coinbase){
                                this.setState({gameState: IGameState.player2WaitingForMove});
                            } 
                            else if(j1 === window.web3.eth.coinbase){
                                this.setState({gameState: IGameState.player1WaitingForTimeoutOrPlayer2});
                            }                            
                        }}>Join Game</button>
                    </div>
                );
            case IGameState.player1WaitingForTimeoutOrPlayer2:
                return (
                    <div className="home-page">
                        <h2>Welcome to</h2>
                        <h1>RPS</h1>
                        <p>
                            Your opponnent has 5 minutes to trigger the solve function.
                            Use the Update button to see if you are eligible to trigger the
                            timeout or if your opponnent done their turn.
                        </p>
                        <button onClick={async () => {
                            const RPS = contracts.RPS.at(this.state.contractAddress);
                            const [lastAction, TIMEOUT, c2] = await Promise.all([
                                RPS.lastAction.call(),
                                RPS.TIMEOUT.call(),
                                RPS.c2.call()
                            ]) as [BigNumber.BigNumber, BigNumber.BigNumber, BigNumber.BigNumber, BigNumber.BigNumber];
                            if(c2.toNumber() !== IMove.Null){
                                this.setState({gameState: IGameState.player1CanSolve});
                            }
                            else {
                                window.web3.eth.getBlock('latest', (error, block) => {
                                    if(block.timestamp > lastAction.plus(TIMEOUT).toNumber()){
                                        this.setState({gameState: IGameState.player1CanTimeout})
                                    }
                                });
                            }
                        }}>Update</button>
                    </div>
                );
            case IGameState.player1CanTimeout:
                return (
                    <div className="home-page">
                        <h2>Welcome to</h2>
                        <h1>RPS</h1>
                        <p>
                            Your opponnent has not played the game. You may timeout the game
                            and collect your funds.
                        </p>
                        <button onClick={async () => {
                            const RPS = contracts.RPS.at(this.state.contractAddress);
                            await RPS.j2Timeout({from: window.web3.eth.coinbase});
                            this.setState({gameState: IGameState.finished});

                        }}>Timeout</button>
                    </div>
                );
            case IGameState.player1CanSolve:
                return (
                    <div className="home-page">
                        <h2>Welcome to</h2>
                        <h1>RPS</h1>
                        <p>
                            You can solve the game and finish it now.
                        </p>
                        <button onClick={async () => {
                            const RPS = contracts.RPS.at(this.state.contractAddress);
                            await RPS.solve(this.move, this.salt, {from: window.web3.eth.coinbase});
                            this.setState({gameState: IGameState.finished});

                        }}>Solve</button>
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
            case IGameState.player2WaitingForTimeoutOrSolve:
                return (
                    <div className="home-page">
                        <h2>Welcome to</h2>
                        <h1>RPS</h1>
                        <p>
                            Your opponnent has 5 minutes to trigger the solve function.
                            Use the Update button to see if you are eligible to trigger the
                            timeout or if your opponnent has completed the game.
                        </p>
                        <button onClick={async () => {
                            const RPS = contracts.RPS.at(this.state.contractAddress);
                            const [lastAction, TIMEOUT, stake] = await Promise.all([
                                RPS.lastAction.call(),
                                RPS.TIMEOUT.call(),
                                RPS.stake.call()
                            ]) as [BigNumber.BigNumber, BigNumber.BigNumber, BigNumber.BigNumber, BigNumber.BigNumber];
                            if(stake.equals(0)){
                                this.setState({gameState: IGameState.finished});
                            }
                            else {
                                window.web3.eth.getBlock('latest', (error, block) => {
                                    if(block.timestamp > lastAction.plus(TIMEOUT).toNumber()){
                                        this.setState({gameState: IGameState.player2CanTimeout})
                                    }
                                });
                            }

                        }}>Update</button>
                    </div>
                );
            case IGameState.player2CanTimeout:
                return (
                    <div className="home-page">
                        <h2>Welcome to</h2>
                        <h1>RPS</h1>
                        <p>
                            Your opponnent has not solved the game. You may timeout the game
                            and collect all funds.
                        </p>
                        <button onClick={async () => {
                            const RPS = contracts.RPS.at(this.state.contractAddress);
                            await RPS.j1Timeout({from: window.web3.eth.coinbase});
                            this.setState({gameState: IGameState.finished});

                        }}>Timeout</button>
                    </div>
                );
            default:
                return null;
        }
    }
}
