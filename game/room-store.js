import fs from 'node:fs';
import path from 'node:path';
// One Node process owns a store. A write is durable before a room update is broadcast.
export class FileRoomStore {
 constructor(file){this.file=path.resolve(file);fs.mkdirSync(path.dirname(this.file),{recursive:true});}
 load(){try{const data=JSON.parse(fs.readFileSync(this.file,'utf8'));if(data.version!==1||!Array.isArray(data.rooms))throw Error('Unsupported room store');return data.rooms;}catch(error){if(error.code==='ENOENT')return [];throw Error('Room storage cannot be read; refusing to replace existing data: '+error.message);}}
 save(rooms){const tmp=this.file+'.tmp';let fd;try{fd=fs.openSync(tmp,'w',0o600);fs.writeFileSync(fd,JSON.stringify({version:1,rooms}));fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(tmp,this.file);}catch(error){if(fd!==undefined)fs.closeSync(fd);error.storageFailure=true;throw error;}}
}
