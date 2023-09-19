/**
 * Password hashing using Web Crypto API (PBKDF2)
 * No external dependencies needed
 */

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function getCryptoKey(password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
}

export async function hash(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const key = await getCryptoKey(password);

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-512',
    },
    key,
    KEY_LENGTH * 8
  );

  const hashArray = new Uint8Array(derivedBits);
  const hashBuffer = new Uint8Array(salt.length + hashArray.length);
  hashBuffer.set(salt, 0);
  hashBuffer.set(hashArray, salt.length);

  return Buffer.from(hashBuffer).toString('base64');
}

export async function compare(password: string, storedHash: string): Promise<boolean> {
  const hashBuffer = Buffer.from(storedHash, 'base64');
  const salt = hashBuffer.subarray(0, SALT_LENGTH);
  const storedKey = hashBuffer.subarray(SALT_LENGTH);

  const key = await getCryptoKey(password);

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-512',
    },
    key,
    KEY_LENGTH * 8
  );

  const derivedKey = new Uint8Array(derivedBits);

  if (derivedKey.length !== storedKey.length) return false;

  // Constant-time comparison to prevent timing attacks
  let result = 0;
  for (let i = 0; i < derivedKey.length; i++) {
    result |= derivedKey[i]! ^ storedKey[i]!;
  }

  return result === 0;
}
