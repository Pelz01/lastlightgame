import {build} from 'esbuild';
await build({entryPoints:['client/near-sdk-entry.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,outfile:'client/near-wallet.js',legalComments:'eof',inject:['client/browser-buffer.js']});
