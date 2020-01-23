import { expect } from 'chai';
import plugin from '../src/index';

describe('Plugin', () => {
  it('it should return ChromeWebStore instance', () => {
    const itemId = 'foo';
    const credential = {};
    const accessTokenResponse = {};
    const chromeWebStore = plugin(JSON.stringify(credential), JSON.stringify(accessTokenResponse));
    const item = chromeWebStore.item(itemId);
    expect(item).to.have.property('upload');
    expect(item).to.have.property('publish');
  });
});
