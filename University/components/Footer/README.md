# Footer Components & Routes

All footer-related pages and components are centralized in this directory.

## 📁 Structure
```
Footer/
├── index.tsx              # Main footer component
├── footer.module.css      # Footer styles
├── all-blogs/             # Blog listing page
├── academic_institution/  # Academic institutions page
├── contact/               # Contact form page
├── career/                # Career application page
├── terms_condition/       # Terms & conditions page
├── privacy_policy/        # Privacy policy page
├── school_solution/       # School solutions page
└── learning_hub/          # Learning hub iframe page
```

## 🔗 Custom Routing

All pages use **Next.js rewrites** for clean URLs matching Laravel routes:

### Public URLs (what users see):
- `/all-blogs`
- `/academic_institution`
- `/contact`
- `/career`
- `/terms_condition`
- `/privacy_policy`
- `/school_solution`
- `/learning_hub`

### Internal Routes (actual file location):
- `/footer/all-blogs` → `app/footer/all-blogs/page.tsx`
- `/footer/academic_institution` → `app/footer/academic_institution/page.tsx`
- etc.

### Configuration
Rewrites are configured in `next.config.ts`:
```typescript
async rewrites() {
  return [
    { source: '/all-blogs', destination: '/footer/all-blogs' },

  ];
}
```

## 🎯 Benefits
1. ✅ All footer files organized in one place
2. ✅ Clean URLs matching Laravel routes
3. ✅ Easy to maintain and update
4. ✅ Components reusable across the app
