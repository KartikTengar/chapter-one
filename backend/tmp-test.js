import { SignJWT, jwtVerify } from 'jose';
const secret = new TextEncoder().encode('testsecret');
(async () => {
  const token = await new SignJWT({ sub: 'u', email:'e', role:'admin' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer('supabase')
    .setAudience('authenticated')
    .setExpirationTime('1h')
    .sign(secret);
  console.log('token', token);
  const { payload } = await jwtVerify(token, secret, { issuer: 'supabase', audience: 'authenticated' });
  console.log('payload', payload);
})();
