const mongoose = require('mongoose');

const imageItemSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    subtitle: { type: String, trim: true, default: '' },
    translations: {
      en: {
        title: { type: String, trim: true, default: '' },
        subtitle: { type: String, trim: true, default: '' },
      },
      hi: {
        title: { type: String, trim: true, default: '' },
        subtitle: { type: String, trim: true, default: '' },
      },
    },
    imageUrl: { type: String, trim: true, default: '' },
    link: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const featuredContentSchema = new mongoose.Schema(
  {
    type: { type: String, trim: true, default: 'library' },
    refId: { type: mongoose.Schema.Types.ObjectId },
    title: { type: String, trim: true, default: '' },
    translations: {
      en: { title: { type: String, trim: true, default: '' } },
      hi: { title: { type: String, trim: true, default: '' } },
    },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const appConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    onboardingSlides: { type: [imageItemSchema], default: [] },
    homeBanners: { type: [imageItemSchema], default: [] },
    featuredContent: { type: [featuredContentSchema], default: [] },
    support: {
      email: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
    },
    appVersion: { type: String, trim: true, default: '1.0.0' },
    // branding — admin se logo / app name / title / theme colours edit ho sakein
    branding: {
      appName: { type: String, trim: true, default: 'Shree Yantra' },
      tagline: { type: String, trim: true, default: 'Astrology' },
      translations: {
        en: {
          appName: { type: String, trim: true, default: 'Shree Yantra' },
          tagline: { type: String, trim: true, default: 'Astrology' },
        },
        hi: {
          appName: { type: String, trim: true, default: '' },
          tagline: { type: String, trim: true, default: '' },
        },
      },
      logoUrl: { type: String, trim: true, default: '' },
      primaryColor: { type: String, trim: true, default: '' },
      accentColor: { type: String, trim: true, default: '' },
    },
    featureFlags: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true }
);

appConfigSchema.statics.getGlobal = async function () {
  return this.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global' } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

module.exports = mongoose.model('AppConfig', appConfigSchema);
