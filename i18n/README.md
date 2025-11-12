# Internationalization (i18n) Structure

This folder contains a proposed file structure and supporting scripts for bilingual content management (English and Spanish es-MX) without altering existing business logic. It is designed to be integrated gradually.

## Structure

```
i18n/
  README.md
  locales/
    en/
      home.json
      product-config.json
    es-MX/
      home.json
      product-config.json
  scripts/
    check-missing.ts
    notify-overdue.ts
```

## Notes

- English (en) is the source-of-truth. Spanish (es-MX) should mirror keys one-to-one.
- Fallback to English should occur when a key is missing in es-MX.
- The scripts help detect missing keys and simulate notifications for overdue translation reviews.