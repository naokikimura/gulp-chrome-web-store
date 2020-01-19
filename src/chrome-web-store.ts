import { ClientRequest, IncomingMessage, RequestOptions } from 'http';
import querystring from 'querystring';
import stream from 'stream';
import { URL } from 'url';

const agent = undefined;

function createRequest(url: string | URL, options: RequestOptions): ClientRequest {
  url = new URL(url.toString());
  return require(url.protocol.replace(/:$/, '')).request(url, Object.assign({ agent }, options));
}

function fetch(request: ClientRequest) {
  return new Promise<IncomingMessage>((resolve, reject) => {
    request.on('response', resolve).on('error', reject).end();
  });
}

function toJSON<T>(response: IncomingMessage) {
  return new Promise<T>((resolve, reject) => {
    const data: any[] = [];
    response
      .on('data', chunk => { data.push(chunk); })
      .on('end', () => {
        const body = data.reduce((text, chunk) => text + chunk.toString());
        try {
          resolve(JSON.parse(body) as T);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

function isSuccessful(response: IncomingMessage) {
  return response.statusCode !== undefined && response.statusCode >= 200 && response.statusCode <= 299;
}

type ResponseConditionFunction = (response: IncomingMessage) => boolean;
type ResponseParseFunction<T> = (response: IncomingMessage) => Promise<T>;

function ResponseParser<T>(condition: ResponseConditionFunction, parse: ResponseParseFunction<T>) {
  return function parseResponse(response: IncomingMessage) {
    if (!condition(response)) throw new Error(response.statusMessage);
    return parse(response);
  };
}

export interface Credential {
  installed: {
    client_id: string;
    client_secret: string;
  };
}

export interface AccessTokenResponse {
  access_token: string;
  refresh_token: string;
}

export type UploadType = '' | 'media';
export type PublishTarget = 'trustedTesters' | 'default';

export default class ChromeWebStoreAPI {
  private accessTokenResponse: AccessTokenResponse;
  private credential: Credential;

  constructor(credential: Credential, accessTokenResponse: AccessTokenResponse) {
    this.credential = credential;
    this.accessTokenResponse = accessTokenResponse;
  }

  private async refreshToken() {
    const url = new URL('https://accounts.google.com/o/oauth2/token');
    const request = createRequest(url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    });
    request.write(querystring.stringify({
      client_id: this.credential.installed.client_id,
      client_secret: this.credential.installed.client_secret,
      grant_type: 'refresh_token',
      refresh_token: this.accessTokenResponse.refresh_token,
    }));
    return Object.assign(
      this.accessTokenResponse,
      await fetch(request).then(ResponseParser<AccessTokenResponse>(isSuccessful, toJSON)),
    );
  }

  get Item() {
    const that = this;

    /**
     * Gets a Chrome Web Store item.
     *
     * @param id Unique identifier representing the Chrome App, Chrome Extension, or the Chrome Theme.
     * @param projection Determines which subset of the item information to return.
     * @see https://developer.chrome.com/webstore/webstore_api/items/get
     */
    async function fetchItem(id: string, projection: 'DRAFT' | 'PUBLISHED' = 'DRAFT') {
      const { access_token } = await that.refreshToken();
      const url = new URL(id, 'https://www.googleapis.com/chromewebstore/v1.1/items/');
      url.searchParams.set('projection', projection);
      const request = createRequest(url, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'x-goog-api-version': 2,
        },
        method: 'GET',
      });
      return fetch(request).then(ResponseParser<ItemLake>(isSuccessful, toJSON));
    }

    interface ItemLake {
      id: string;
      kind: 'chromewebstore#item';
      publicKey?: string;
      uploadState?: string;
      crxVersion?: string;
      itemError?: ItemError[];
    }

    interface ItemError {
      error_detail: string;
    }

    interface PublishItemResult {
      kind: 'chromewebstore#item';
      item_id: string;
      status: string[];
      statusDetail: string[];
    }

    type Contents = string | Buffer | stream.Readable;

    return class Item implements ItemLake {
      public static valueOf({ id, publicKey, uploadState, crxVersion, itemError }: ItemLake) {
        return new this(id, publicKey, uploadState, crxVersion, itemError);
      }

      public static async fetch(id: string) {
        return this.valueOf(await fetchItem(id));
      }

      public readonly kind = 'chromewebstore#item';

      constructor(
        public readonly id: string,
        public readonly publicKey?: string,
        public readonly uploadState?: string,
        public readonly crxVersion?: string,
        public readonly itemError?: ItemError[],
      ) {
      }

      /**
       * Updates an existing item.
       *
       * @param contents Item
       * @param uploadType The type of upload request to the /upload URI
       * @see https://developer.chrome.com/webstore/webstore_api/items/update
       */
      public async upload(contents: Contents, uploadType: UploadType = '') {
        const { access_token } = await that.refreshToken();
        const url = new URL(this.id, 'https://www.googleapis.com/upload/chromewebstore/v1.1/items/');
        url.searchParams.set('uploadType', uploadType);
        const request = createRequest(url, {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'x-goog-api-version': 2,
          },
          method: 'PUT',
        });
        if (contents instanceof stream.Readable) {
          contents.pipe(request);
        } else {
          request.write(contents);
        }
        return fetch(request).then(ResponseParser<ItemLake>(isSuccessful, toJSON));
      }

      /**
       * Publishes an item.
       *
       * @param publishTarget Provide defined publishTarget in URL: `trustedTesters` or `default`
       * @see https://developer.chrome.com/webstore/webstore_api/items/publish
       */
      public async publish(publishTarget: PublishTarget = 'default') {
        const { access_token } = await that.refreshToken();
        const url = new URL(`${this.id}/publish`, 'https://www.googleapis.com/chromewebstore/v1.1/items/');
        url.searchParams.set('publishTarget', publishTarget);
        const request = createRequest(url, {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Length': 0,
            'method': 'POST',
            'x-goog-api-version': 2,
          },
        });
        return fetch(request).then(ResponseParser<PublishItemResult>(isSuccessful, toJSON));
      }
    };
  }
}
