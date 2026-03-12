import crypto from 'node:crypto';

const TWITTER_TWEET_URL = 'https://api.twitter.com/2/tweets';

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

export async function publishTweet(
  content: string,
  accessToken: string,
  accessSecret: string,
): Promise<{ success: boolean; tweetId?: string; error?: string }> {
  try {
    const consumerKey = process.env.X_CONSUMER_KEY || '';
    const consumerSecret = process.env.X_CONSUMER_SECRET || '';

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: consumerKey,
      oauth_nonce: generateNonce(),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: generateTimestamp(),
      oauth_token: accessToken,
      oauth_version: '1.0',
    };

    const baseString = buildSignatureBaseString('POST', TWITTER_TWEET_URL, oauthParams);
    const signature = signHmacSha1(baseString, consumerSecret, accessSecret);

    const headerParams = {
      ...oauthParams,
      oauth_signature: signature,
    };

    const response = await fetch(TWITTER_TWEET_URL, {
      method: 'POST',
      headers: {
        Authorization: buildAuthorizationHeader(headerParams),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: content }),
    });

    if (!response.ok) {
      const text = await response.text();

      // Handle rate limiting
      if (response.status === 429) {
        return { success: false, error: `Rate limited: ${text}` };
      }

      return { success: false, error: `X API error ${response.status}: ${text}` };
    }

    const data = (await response.json()) as { data?: { id?: string } };
    const tweetId = data?.data?.id;

    return { success: true, tweetId: tweetId ?? undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}
