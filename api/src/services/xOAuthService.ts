import crypto from 'node:crypto';
import { config } from '../config/index.js';

const TWITTER_REQUEST_TOKEN_URL = 'https://api.twitter.com/oauth/request_token';
const TWITTER_ACCESS_TOKEN_URL = 'https://api.twitter.com/oauth/access_token';
const TWITTER_AUTHORIZE_URL = 'https://api.twitter.com/oauth/authorize';

type RequestTokenEntry = {
  token: string;
  secret: string;
  botId: string;
  createdAt: number;
};

// In-memory store with TTL (10 minutes)
const REQUEST_TOKEN_TTL_MS = 10 * 60 * 1000;
const requestTokenStore = new Map<string, RequestTokenEntry>();

function cleanExpiredTokens(): void {
  const now = Date.now();
  for (const [key, entry] of requestTokenStore.entries()) {
    if (now - entry.createdAt > REQUEST_TOKEN_TTL_MS) {
      requestTokenStore.delete(key);
    }
  }
}

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

function generateTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

function buildSignatureBaseString(
  method: string,
  url: string,
  params: Record<string, string>,
): string {
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys
    .map((key) => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join('&');

  return `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`;
}

function signHmacSha1(baseString: string, consumerSecret: string, tokenSecret: string): string {
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  const hmac = crypto.createHmac('sha1', signingKey);
  hmac.update(baseString);
  return hmac.digest('base64');
}

function buildAuthorizationHeader(params: Record<string, string>): string {
  const parts = Object.keys(params)
    .sort()
    .map((key) => `${percentEncode(key)}="${percentEncode(params[key])}"`)
    .join(', ');
  return `OAuth ${parts}`;
}

async function makeOAuthRequest(
  method: string,
  url: string,
  oauthParams: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string,
  bodyParams?: Record<string, string>,
): Promise<string> {
  const allParams = { ...oauthParams, ...bodyParams };
  const baseString = buildSignatureBaseString(method, url, allParams);
  const signature = signHmacSha1(baseString, consumerSecret, tokenSecret);

  const headerParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  const headers: Record<string, string> = {
    Authorization: buildAuthorizationHeader(headerParams),
  };

  let body: string | undefined;
  if (bodyParams && Object.keys(bodyParams).length > 0) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    body = Object.entries(bodyParams)
      .map(([k, v]) => `${percentEncode(k)}=${percentEncode(v)}`)
      .join('&');
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Twitter OAuth request failed: ${response.status} ${text}`);
  }

  return response.text();
}

function parseResponseParams(body: string): Record<string, string> {
  const params: Record<string, string> = {};
  for (const pair of body.split('&')) {
    const [key, value] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  }
  return params;
}

export const xOAuthService = {
  async getRequestToken(botId: string): Promise<{ oauthToken: string }> {
    cleanExpiredTokens();

    const consumerKey = process.env.X_CONSUMER_KEY || '';
    const consumerSecret = process.env.X_CONSUMER_SECRET || '';
    const callbackUrl = `${config.app.baseUrl}/api/auth/x/callback`;

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: consumerKey,
      oauth_nonce: generateNonce(),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: generateTimestamp(),
      oauth_version: '1.0',
      oauth_callback: callbackUrl,
    };

    const responseBody = await makeOAuthRequest(
      'POST',
      TWITTER_REQUEST_TOKEN_URL,
      oauthParams,
      consumerSecret,
      '',
    );

    const parsed = parseResponseParams(responseBody);
    const oauthToken = parsed['oauth_token'];
    const oauthTokenSecret = parsed['oauth_token_secret'];

    if (!oauthToken || !oauthTokenSecret) {
      throw new Error('Failed to obtain request token from Twitter');
    }

    requestTokenStore.set(oauthToken, {
      token: oauthToken,
      secret: oauthTokenSecret,
      botId,
      createdAt: Date.now(),
    });

    return { oauthToken };
  },

  async getAccessToken(
    oauthToken: string,
    oauthVerifier: string,
  ): Promise<{
    accessToken: string;
    accessTokenSecret: string;
    screenName: string;
    botId: string;
  }> {
    cleanExpiredTokens();

    const entry = requestTokenStore.get(oauthToken);
    if (!entry) {
      throw new Error('Invalid or expired request token');
    }

    requestTokenStore.delete(oauthToken);

    const consumerKey = process.env.X_CONSUMER_KEY || '';
    const consumerSecret = process.env.X_CONSUMER_SECRET || '';

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: consumerKey,
      oauth_nonce: generateNonce(),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: generateTimestamp(),
      oauth_token: oauthToken,
      oauth_version: '1.0',
    };

    const bodyParams: Record<string, string> = {
      oauth_verifier: oauthVerifier,
    };

    const responseBody = await makeOAuthRequest(
      'POST',
      TWITTER_ACCESS_TOKEN_URL,
      oauthParams,
      consumerSecret,
      entry.secret,
      bodyParams,
    );

    const parsed = parseResponseParams(responseBody);
    const accessToken = parsed['oauth_token'];
    const accessTokenSecret = parsed['oauth_token_secret'];
    const screenName = parsed['screen_name'] || '';

    if (!accessToken || !accessTokenSecret) {
      throw new Error('Failed to obtain access token from Twitter');
    }

    return {
      accessToken,
      accessTokenSecret,
      screenName,
      botId: entry.botId,
    };
  },

  generateAuthUrl(oauthToken: string): string {
    return `${TWITTER_AUTHORIZE_URL}?oauth_token=${percentEncode(oauthToken)}`;
  },
};
