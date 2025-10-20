# TODO: Fix Category Dropdown Translation

## Tasks
- [ ] Update college-maintenance/src/app/components/ComplaintForm.tsx to use dynamic translations for category options
- [ ] Update college-maintenance/src/app/student-dashboard/components/ComplaintForm.tsx to use dynamic translations for category options
- [ ] Test the translation toggle to ensure category options change dynamically

## Information Gathered
- Translations.js already contains category translations: electrical, plumbing, cleaning, internet, security, other in both en and hi.
- ComplaintForm components currently have hardcoded CATEGORY_OPTIONS and CATEGORY_OPTIONS_HI arrays.
- The main ComplaintForm uses useTranslation but still hardcodes options.
- Need to make category labels dynamic based on current language, keeping values in English for consistency.

## Plan
- Replace hardcoded category arrays with a dynamic function that uses t() to get labels.
- Use the same value ("Electrical", etc.) but translate the label.
- Ensure ThirdPartyAutocompleteDropdown receives translated options.

## Dependent Files
- college-maintenance/src/app/components/ComplaintForm.tsx
- college-maintenance/src/app/student-dashboard/components/ComplaintForm.tsx

## Followup Steps
- Run the app and toggle language to verify category options translate correctly.
- Check if any other components need similar updates (e.g., filters in tables).
