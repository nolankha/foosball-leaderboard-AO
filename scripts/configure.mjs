import {readFileSync,writeFileSync} from 'node:fs';
const accountId=process.env.CLOUDFLARE_ACCOUNT_ID;
const databaseId=process.env.FOOSWINS_DATABASE_ID;
if(!accountId||!/^[a-f0-9]{32}$/.test(accountId)||!databaseId||!/^[a-f0-9-]{36}$/.test(databaseId)){
 throw new Error('Set CLOUDFLARE_ACCOUNT_ID and FOOSWINS_DATABASE_ID in your private deployment environment. Deployment stopped to prevent connecting the wrong database.');
}
const config=JSON.parse(readFileSync('wrangler.jsonc','utf8'));
config.account_id=accountId;
config.d1_databases[0].database_id=databaseId;
writeFileSync('wrangler.deploy.jsonc',JSON.stringify(config,null,2)+'\n',{mode:0o600});
console.log('Private deployment configuration prepared.');
