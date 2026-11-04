import {spawnSync} from 'node:child_process';
const dir=process.cwd();const linux=process.platform==='win32'?'/mnt/'+dir[0].toLowerCase()+dir.slice(2).replaceAll('\\','/'):dir;
const command='cd '+"'"+linux.replaceAll("'","'\\''")+"/contracts/last-light' && cargo build --locked --target wasm32-unknown-unknown --release";
const result=process.platform==='win32'?spawnSync('wsl',['-d','Ubuntu','--','bash','-lc',command],{stdio:'inherit'}):spawnSync('bash',['-lc',command],{stdio:'inherit'});process.exit(result.status??1);
