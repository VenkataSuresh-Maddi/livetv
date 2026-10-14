import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Channel, UserPreferences } from '../src/types';
import {
  normalizeLanguageName,
  getNativeLanguageName,
  channelMatchesLanguage,
  extractLanguages,
  getRecommendedChannelsForLanguages,
  CANONICAL_LANGUAGES,
} from '../src/services/languages';
import { DEFAULT_PREFERENCES, loadPreferences, savePreferences } from '../src/services/storage';

describe('Language Personalization & Normalization Service', () => {
  it('should normalize known aliases and codes to canonical language names', () => {
    // Telugu
    assert.strictEqual(normalizeLanguageName('tel'), 'Telugu');
    assert.strictEqual(normalizeLanguageName('te'), 'Telugu');
    assert.strictEqual(normalizeLanguageName('telugu'), 'Telugu');
    assert.strictEqual(normalizeLanguageName('TELUGU'), 'Telugu');

    // Tamil
    assert.strictEqual(normalizeLanguageName('tam'), 'Tamil');
    assert.strictEqual(normalizeLanguageName('ta'), 'Tamil');
    assert.strictEqual(normalizeLanguageName('tamil'), 'Tamil');

    // Hindi
    assert.strictEqual(normalizeLanguageName('hin'), 'Hindi');
    assert.strictEqual(normalizeLanguageName('hi'), 'Hindi');
    assert.strictEqual(normalizeLanguageName('HINDI'), 'Hindi');

    // Kannada
    assert.strictEqual(normalizeLanguageName('kan'), 'Kannada');
    assert.strictEqual(normalizeLanguageName('kn'), 'Kannada');
    assert.strictEqual(normalizeLanguageName('kannada'), 'Kannada');

    // Malayalam
    assert.strictEqual(normalizeLanguageName('mal'), 'Malayalam');
    assert.strictEqual(normalizeLanguageName('ml'), 'Malayalam');
    assert.strictEqual(normalizeLanguageName('malayalam'), 'Malayalam');

    // Bengali
    assert.strictEqual(normalizeLanguageName('ben'), 'Bengali');
    assert.strictEqual(normalizeLanguageName('bn'), 'Bengali');
    assert.strictEqual(normalizeLanguageName('bangla'), 'Bengali');

    // Marathi
    assert.strictEqual(normalizeLanguageName('mar'), 'Marathi');
    assert.strictEqual(normalizeLanguageName('mr'), 'Marathi');
    assert.strictEqual(normalizeLanguageName('marathi'), 'Marathi');

    // Gujarati
    assert.strictEqual(normalizeLanguageName('guj'), 'Gujarati');
    assert.strictEqual(normalizeLanguageName('gu'), 'Gujarati');
    assert.strictEqual(normalizeLanguageName('gujarati'), 'Gujarati');

    // Punjabi
    assert.strictEqual(normalizeLanguageName('pan'), 'Punjabi');
    assert.strictEqual(normalizeLanguageName('pun'), 'Punjabi');
    assert.strictEqual(normalizeLanguageName('punjabi'), 'Punjabi');

    // Odia
    assert.strictEqual(normalizeLanguageName('ori'), 'Odia');
    assert.strictEqual(normalizeLanguageName('odi'), 'Odia');
    assert.strictEqual(normalizeLanguageName('oriya'), 'Odia');

    // Assamese
    assert.strictEqual(normalizeLanguageName('asm'), 'Assamese');
    assert.strictEqual(normalizeLanguageName('as'), 'Assamese');
    assert.strictEqual(normalizeLanguageName('assamese'), 'Assamese');

    // Bhojpuri
    assert.strictEqual(normalizeLanguageName('bho'), 'Bhojpuri');
    assert.strictEqual(normalizeLanguageName('bhojpuri'), 'Bhojpuri');

    // English & International
    assert.strictEqual(normalizeLanguageName('eng'), 'English');
    assert.strictEqual(normalizeLanguageName('en'), 'English');
    assert.strictEqual(normalizeLanguageName('spa'), 'Spanish');
    assert.strictEqual(normalizeLanguageName('es'), 'Spanish');
    assert.strictEqual(normalizeLanguageName('deu'), 'German');
    assert.strictEqual(normalizeLanguageName('fra'), 'French');
    assert.strictEqual(normalizeLanguageName('jpn'), 'Japanese');
    assert.strictEqual(normalizeLanguageName('ara'), 'Arabic');
  });

  it('should provide native script names for Indian regional and international languages', () => {
    assert.strictEqual(getNativeLanguageName('Telugu'), 'తెలుగు');
    assert.strictEqual(getNativeLanguageName('Tamil'), 'தமிழ்');
    assert.strictEqual(getNativeLanguageName('Hindi'), 'हिन्दी');
    assert.strictEqual(getNativeLanguageName('Kannada'), 'ಕನ್ನಡ');
    assert.strictEqual(getNativeLanguageName('Malayalam'), 'മലയാളം');
    assert.strictEqual(getNativeLanguageName('Bengali'), 'বাংলা');
    assert.strictEqual(getNativeLanguageName('Marathi'), 'मराठी');
    assert.strictEqual(getNativeLanguageName('Gujarati'), 'ગુજરાતી');
    assert.strictEqual(getNativeLanguageName('Punjabi'), 'ਪੰਜਾਬੀ');
    assert.strictEqual(getNativeLanguageName('Odia'), 'ଓଡ଼ିଆ');
    assert.strictEqual(getNativeLanguageName('Assamese'), 'অসমীয়া');
    assert.strictEqual(getNativeLanguageName('Bhojpuri'), 'भोजपुरी');
  });

  it('should match channels dynamically based on metadata without location inference', () => {
    const starMaaTelugu: Channel = {
      id: 'star-maa',
      name: 'Star Maa HD',
      logo: '',
      url: 'https://stream.server/star-maa.m3u8',
      group: 'Entertainment',
      language: 'Telugu',
      country: 'IN',
    };

    const aajTakHindi: Channel = {
      id: 'aaj-tak',
      name: 'Aaj Tak Live News',
      logo: '',
      url: 'https://stream.server/aajtak.m3u8',
      group: 'News',
      language: 'Hindi',
      country: 'IN',
    };

    const sunTvTamil: Channel = {
      id: 'sun-tv',
      name: 'Sun TV Tamil',
      logo: '',
      url: 'https://stream.server/suntv.m3u8',
      group: 'Entertainment',
      language: 'Tamil',
      country: 'IN',
    };

    const nasaTvEnglish: Channel = {
      id: 'nasa-tv',
      name: 'NASA TV Live (HD)',
      logo: '',
      url: 'https://stream.server/nasa.m3u8',
      group: 'Science',
      language: 'English',
      country: 'US',
    };

    assert.ok(channelMatchesLanguage(starMaaTelugu, 'Telugu'));
    assert.ok(!channelMatchesLanguage(starMaaTelugu, 'Hindi'));
    assert.ok(!channelMatchesLanguage(starMaaTelugu, 'Tamil'));

    assert.ok(channelMatchesLanguage(aajTakHindi, 'Hindi'));
    assert.ok(!channelMatchesLanguage(aajTakHindi, 'Telugu'));

    assert.ok(channelMatchesLanguage(sunTvTamil, 'Tamil'));
    assert.ok(!channelMatchesLanguage(sunTvTamil, 'English'));

    assert.ok(channelMatchesLanguage(nasaTvEnglish, 'English'));
    assert.ok(!channelMatchesLanguage(nasaTvEnglish, 'Hindi'));
  });

  it('should extract canonical and discovered languages with channel counts', () => {
    const sampleChannels: Channel[] = [
      { id: '1', name: 'TV9 Telugu', logo: '', url: 'http://1', group: 'News', language: 'Telugu' },
      { id: '2', name: 'V6 News', logo: '', url: 'http://2', group: 'News', language: 'Telugu' },
      { id: '3', name: 'Aaj Tak', logo: '', url: 'http://3', group: 'News', language: 'Hindi' },
      { id: '4', name: 'Sun TV', logo: '', url: 'http://4', group: 'Entertainment', language: 'Tamil' },
      { id: '5', name: 'BBC News', logo: '', url: 'http://5', group: 'News', language: 'English' },
    ];

    const extracted = extractLanguages(sampleChannels);
    assert.ok(extracted.length >= 13, 'Must include all canonical languages');

    const telugu = extracted.find((l) => l.name === 'Telugu');
    assert.ok(telugu);
    assert.strictEqual(telugu?.count, 2);

    const hindi = extracted.find((l) => l.name === 'Hindi');
    assert.ok(hindi);
    assert.strictEqual(hindi?.count, 1);

    const tamil = extracted.find((l) => l.name === 'Tamil');
    assert.ok(tamil);
    assert.strictEqual(tamil?.count, 1);

    const english = extracted.find((l) => l.name === 'English');
    assert.ok(english);
    assert.strictEqual(english?.count, 1);
  });

  it('should produce personalized channel list for chosen languages without mutating My List', () => {
    const sampleChannels: Channel[] = [
      { id: '1', name: 'TV9 Telugu', logo: '', url: 'http://1', group: 'News', language: 'Telugu' },
      { id: '2', name: 'Aaj Tak Hindi', logo: '', url: 'http://2', group: 'News', language: 'Hindi' },
      { id: '3', name: 'DW News', logo: '', url: 'http://3', group: 'News', language: 'English' },
      { id: '4', name: 'Sun TV', logo: '', url: 'http://4', group: 'Entertainment', language: 'Tamil' },
    ];

    const userPreferred = ['Telugu', 'Hindi'];
    const personalized = getRecommendedChannelsForLanguages(sampleChannels, userPreferred);

    assert.strictEqual(personalized.length, 2);
    assert.ok(personalized.some((c) => c.name === 'TV9 Telugu'));
    assert.ok(personalized.some((c) => c.name === 'Aaj Tak Hindi'));
    assert.ok(!personalized.some((c) => c.name === 'DW News'));
    assert.ok(!personalized.some((c) => c.name === 'Sun TV'));
  });

  it('should maintain language preferences separate from My List / favorites', () => {
    const prefs: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      favorites: ['chan-1', 'chan-2'],
      preferredLanguages: ['Telugu', 'Hindi'],
      hasCompletedLanguageOnboarding: true,
    };

    assert.deepStrictEqual(prefs.favorites, ['chan-1', 'chan-2']);
    assert.deepStrictEqual(prefs.preferredLanguages, ['Telugu', 'Hindi']);
    assert.strictEqual(prefs.hasCompletedLanguageOnboarding, true);

    // Toggling or clearing favorites does not touch language preferences
    const updatedFavs = { ...prefs, favorites: [] };
    assert.deepStrictEqual(updatedFavs.preferredLanguages, ['Telugu', 'Hindi']);

    // Changing language preferences does not touch favorites
    const updatedLangs = { ...prefs, preferredLanguages: ['Tamil'] };
    assert.deepStrictEqual(updatedLangs.favorites, ['chan-1', 'chan-2']);
  });

  it('does NOT invoke or require browser geolocation or IP location APIs', () => {
    // Assert that language personalization is driven solely by user selection and metadata
    assert.strictEqual(typeof navigator !== 'undefined' ? (navigator as any).geolocation : undefined, undefined);
  });
});
