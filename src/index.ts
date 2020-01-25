import ChromeWebStore, { AccessTokenResponse, Credential, PublishTarget, UploadType } from 'chrome-web-store-api';
import PluginError from 'plugin-error';
import stream from 'stream';

const PLUGIN_NAME = 'gulp-chrome-web-store';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export = function Plugin(credential: string | Credential, accessTokenResponse: string | AccessTokenResponse) {
  const chromeWebStore = new ChromeWebStore(
    typeof credential === 'string' ? JSON.parse(credential) : credential,
    typeof accessTokenResponse === 'string' ? JSON.parse(accessTokenResponse) : accessTokenResponse,
  );
  return new class {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    public item(id: string) {
      return {
        upload(uploadType: UploadType = ''): stream.Transform {
          return new stream.Transform({
            objectMode: true,
            transform(vinyl, encoding, callback): void {
              Promise.resolve(new chromeWebStore.Item(id)).then(async item => {
                const result = await item.upload(vinyl.contents, uploadType);
                if (result.uploadState === 'FAILURE') {
                  const message = (result.itemError || []).map(error => error.error_detail).join('\n');
                  throw new PluginError(PLUGIN_NAME, message);
                }
                this.push(vinyl);
                return null;
              }).then(callback).catch(error => callback(new PluginError(PLUGIN_NAME, error)));
            },
          });
        },
        async publish(publishTarget: PublishTarget = 'default'): Promise<void> {
          try {
            const item = new chromeWebStore.Item(id);
            const result = await item.publish(publishTarget);
            (result.statusDetail || []).forEach(detail => console.log(detail));
          } catch (error) {
            throw new PluginError(PLUGIN_NAME, error);
          }
        },
      };
    }
  }();
};
