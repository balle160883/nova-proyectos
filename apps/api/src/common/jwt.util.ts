import * as crypto from 'crypto';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SECURITY ERROR: JWT_SECRET environment variable is missing in production!');
    }
    return 'dev_fallback_monday_m365_jwt_secret_2026_x89f!';
  }
  return secret;
};

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
  iat?: number;
  exp?: number;
}

export function signJwt(payload: JwtPayload, expiresInSeconds = 86400): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;

  const fullPayload = { ...payload, iat, exp };

  const base64UrlHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64UrlPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(`${base64UrlHeader}.${base64UrlPayload}`)
    .digest('base64url');

  return `${base64UrlHeader}.${base64UrlPayload}.${signature}`;
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', getJwtSecret())
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (signatureB64.length !== expectedSignature.length) return null;

    if (crypto.timingSafeEqual(Buffer.from(signatureB64), Buffer.from(expectedSignature))) {
      const payload: JwtPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
      if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
        return null; // Expired
      }
      return payload;
    }
  } catch (e) {
    return null;
  }
  return null;
}
