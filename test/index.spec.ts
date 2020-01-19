import { expect } from 'chai';
import plugin from '../src/index';

describe('Plugin', () => {
  it('it should return ChromeWebStore instance', () => {
    const itemId = 'foo';
    const credential = {};
    const accessTokenResponse = {};
    const chromeWebStore = plugin(itemId, JSON.stringify(credential), JSON.stringify(accessTokenResponse));
    expect(chromeWebStore).to.have.property('upload');
    expect(chromeWebStore).to.have.property('publish');
  });
});
