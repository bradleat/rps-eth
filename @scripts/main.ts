import path = require('path');
import fs = require('fs');
import {spawnSync, fork, spawn, exec} from 'child_process';
import rimraf = require('rimraf');
import * as prgm from 'commander';
import {getPackage, getPackages} from 'rps-config';


function sleep(ms): Promise<any> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runServers(servers: any[]): Promise<void> {
    if (servers.length === 0) {
        console.log('Done.');
        return;
    }

    const nodePackage = servers.shift();
    await sleep(2000);

    const modulePath = path.join(nodePackage.dir, nodePackage.server);
    const packageName = nodePackage.name;
    const process = fork(modulePath, [], {silent: false, cwd: nodePackage.dir});

    runServers(servers);
}


function executeCommand(command: string, packages: any[], options: string = ''): void {
    packages.forEach((nodePackage) => {
        console.log(`Running "yarn ${command}" in ${nodePackage.dir}.`);
        const task = spawnSync(`yarn ${command} ${options}`, {cwd: nodePackage.dir, shell: true});
        console.log(`stdout ${command} ${options} ${nodePackage.name}:  ${task.stdout}`);
        console.warn(`stderr ${command} ${options} ${nodePackage.name}:  ${task.stderr}`);
        console.log(`${command} ${options} ${nodePackage.name} closed with status ${task.status}.`);
        console.log(`Done.\n`);
    });
}

function executeScript(command: string, packages: any[]): void {
    packages.forEach((nodePackage) => {
        const PATH = `${process.env.PATH}:./node_modules/.bin`;
        if(!nodePackage.scripts[command]) {
            return;
        }
        console.log(`Running "${nodePackage.scripts[command]}" in ${nodePackage.dir}.`);
        const task = spawnSync(`${nodePackage.scripts[command]}`, {cwd: nodePackage.dir, shell: true, env: {PATH}});
        console.log(`stdout ${command} ${nodePackage.name}:  ${task.stdout}`);
        console.warn(`stderr ${command} ${nodePackage.name}:  ${task.stderr}`);
        console.log(`${command} ${nodePackage.name} closed with status ${task.status}.`);
        console.log(`Done.\n`);
    });
}


export function main(){
    const packages = getPackages();

    prgm
    .version('0.0.1');

    prgm
    .command('unlink')
    .description('yarn unlink all node packages in order for dependency resolution')
    .action(async () => {
        executeCommand('unlink', packages, '');
    });

    prgm
    .command('install [allowUnsafe]')
    .description('yarn install all node packages in order for dependency resolution')
    .action(async (
        allowUnsafe: boolean = false
    ) => {
        if (allowUnsafe) {
            executeCommand('install', packages, '--unsafe-perm');
        }
        else {
            executeCommand('install', packages, '');
        }
    });

    prgm
    .command('upgrade')
    .description('yarn upgrade all node packages in order for dependency resolution')
    .option('-p, --packageName <packageName>')
    .action(async ({packageName = ''}) => {
        executeCommand('upgrade', packages, packageName);
    });

    prgm
    .command('build')
    .option('-I, --ignore <packageNames>', 'Servers to ignore when running servers.')
    .description('npm run build all node packages in order for dependency resolution')
    .action(async ({ignore = false}: {ignore: string}) => {
        if(!ignore){
            ignore = '';
        }
        const packages: any[] = getPackages(ignore.split(',').map((s) => s.trim()))
        executeScript('build', packages);
    });

    prgm
    .command('clean')
    .description('npm run clean all node packages in order for dependency resolution')
    .action(async () => {
        executeScript('clean', packages);
    });

    prgm
    .command('postinstall')
    .description('npm run postinstall on all node packages in order for dependency resolution')
    .action(async () => {
        executeScript('postinstall', packages);
    });

    prgm
    .command('rm-node-modules')
    .description('Removes all node_modules folders for our node packages')
    .action(async () => {
        packages.forEach((nodePackage) => {
            rimraf(nodePackage.dir + '/node_modules', (error) => {
            });
        });
    });

    prgm
    .command('servers')
    .option('-I, --ignore <packageNames>', 'Servers to ignore when running servers.')
    .option('-P, --prettyprint', 'Will Pretty Print Logs.')
    .description('Run all our APIs as forks')
    .action(({ignore = false, prettyprint = false}: {ignore: string | false, prettyprint: boolean}) => {
        if(!ignore){
            ignore = '';
        }
        const packages: any[] = getPackages(ignore.split(',').map((s) => s.trim()))
        .filter((nodePackage) => nodePackage.server);
        return runServers(packages);
    });

    prgm.parse(process.argv);
};
