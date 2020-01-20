import PluginError from 'plugin-error';
import stream from 'stream';
import ChromeWebStoreAPI, { AccessTokenResponse, Credential, PublishTarget, UploadType } from './chrome-web-store';

const PLUGIN_NAME = 'gulp-chrome-web-store';

// tslint:disable: no-console
export = function Plugin(
  id: string,
  credential: string | Credential,
  accessTokenResponse: string | AccessTokenResponse,
  ) {
  const api = new ChromeWebStoreAPI(
    typeof credential === 'string' ? JSON.parse(credential) : credential,
    typeof accessTokenResponse === 'string' ? JSON.parse(accessTokenResponse) : accessTokenResponse,
  );
  return {
    upload(uploadType: UploadType = '') {
      return new stream.Transform({
        objectMode: true,
        transform(vinyl, encoding, callback) {
          api.Item.fetch(id).then(async item => {
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
    async publish(publishTarget: PublishTarget = 'default') {
      const item = new api.Item(id);
      const result = await item.publish(publishTarget);
      (result.statusDetail || []).forEach(detail => console.log(detail));
    },
  };
};
