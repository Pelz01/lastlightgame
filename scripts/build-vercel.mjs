import fs from 'node:fs/promises';import crypto from 'node:crypto';
const file='dist/client/near-config.js',source=(await fs.readFile(file,'utf8')).replace('"localRooms":true','"localRooms":false');await fs.writeFile(file,source);
const manifest=JSON.parse(await fs.readFile('dist/manifest.json'));manifest.files['client/near-config.js']={bytes:Buffer.byteLength(source),sha256:crypto.createHash('sha256').update(source).digest('hex')};await fs.writeFile('dist/manifest.json',JSON.stringify(manifest,null,2));
