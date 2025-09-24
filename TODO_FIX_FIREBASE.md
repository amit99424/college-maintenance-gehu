# Firebase Authentication Fix - TODO

## Issues Identified
- Firebase API key appears to be invalid/expired
- Error: "auth/invalid-credential" when attempting login
- Need better error handling for authentication failures

## Plan to Fix

### 1. Update Firebase Configuration
- [x] Get fresh API key from Firebase Console
- [x] Update `src/firebase/config.js` with new API key
- [x] Verify project configuration is correct

### 2. Improve Error Handling
- [ ] Update login page error handling
- [ ] Add more specific error messages for different auth errors
- [ ] Add loading states and better UX feedback

### 3. Add Environment Variables
- [ ] Create `.env.local` file
- [ ] Move sensitive Firebase config to environment variables
- [ ] Update config.js to use environment variables

### 4. Test Authentication
- [ ] Test login functionality
- [ ] Verify error handling works correctly
- [ ] Check all user roles can authenticate properly

## Files to Modify
- `src/firebase/config.js`
- `src/app/login/page.js`
- `.env.local` (new file)

## Next Steps
1. Get fresh Firebase API key from user
2. Update configuration files
3. Test authentication flow
