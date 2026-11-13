import { mkdir, writeFile, access } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
await mkdir('work', { recursive: true });
try {
  await access('work/config.local.php');
  console.log('Local config already exists; kept unchanged.');
} catch {
  await writeFile(
    'work/config.local.php',
    `<?php\nreturn [\n 'env'=>'development', 'url'=>'http://localhost:5173',\n 'app_key'=>'${randomBytes(32).toString('hex')}',\n 'db'=>['host'=>'db','port'=>3306,'name'=>'odproduct','user'=>'odproduct','password'=>'local-development-only'],\n 'routing'=>['enabled'=>false,'base_url'=>'https://router.project-osrm.org','timeout'=>5],\n 'telegram'=>['token'=>'','secret'=>'','chat_id'=>'','allowed_users'=>[]],\n];\n`,
    { mode: 0o600 },
  );
  console.log('Created ignored work/config.local.php for Docker development.');
}
