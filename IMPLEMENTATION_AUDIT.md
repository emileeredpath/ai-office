# Implementation Audit: Upgrade Existing AI Office with MVP Backend

**Date**: 2026-07-17  
**Current URL**: https://emileeredpath.github.io/ai-office/  
**Scope**: Upgrade existing frontend with new backend (Stages 1-6 MVP)

---

## 1. Current Frontend Structure

### Framework & Setup
- **Framework**: React 18.3 with TypeScript
- **Router**: React Router v6 with basename="/ai-office"
- **Build**: Vite with TypeScript compilation
- **Styling**: Tailwind CSS + PostCSS
- **State**: Zustand
- **Deployment**: GitHub Actions → GitHub Pages (automated)

### GitHub Pages Configuration ✅
```
Workflow file: .github/workflows/deploy.yml
- Triggers: On push to main branch
- Build: npm run build
- Output: dist/ folder
- Deployment: Automatic to emileeredpath.github.io/ai-office
- Status: Working
```

### Current Component Structure

**Main Entry**:
- `src/App.tsx` - Router setup with basename="/ai-office"
- `src/main.tsx` - React entry point
- `src/components/dashboard/Dashboard.tsx` - Main dashboard component

**Existing Components** (to preserve):
- `components/officeview/` - Isometric office visualization
  - `IsometricOfficeView.tsx` - Main office view
  - `LivingOfficeView.tsx` - Animated office
  - `EmployeeCharacter.tsx` - Employee avatars
  - `RoomBox.tsx`, `RoomFurniture.tsx` - Office furniture
  - `SandyDock.tsx`, `SandyDais.tsx` - Sandy UI
  - `OfficeRightSidebar.tsx` - Right panel
  - `TaskCard.tsx` - Task display

- `components/SandyAgent.tsx` - Sandy AI component

**Existing Types**:
- `src/types/character.ts` - Character definitions
- `src/types/employee.ts` - Employee types

### Current Routes
```
/ai-office/              → Dashboard
(no other routes defined)
```

---

## 2. Components to Retain

✅ **Keep These (Already Built in MVP)**:
1. `Dashboard.tsx` - Main layout (we built this in Step 2)
2. `SandyChat.tsx` - Chat interface (Step 3)
3. `TaskList.tsx` - Task management (Step 2)
4. `EmployeeCard.tsx` - Employee display (Step 2)
5. `CreateTaskModal.tsx` - Task creation (Step 2)
6. `SandyRecommendation.tsx` - Recommendations (Step 3)
7. `SpecialistAIDelegation.tsx` - AI delegation (Step 4)

✅ **Keep These (Existing Office UI)**:
1. Isometric office visualization
2. Employee character displays
3. Office furniture and room components
4. Sandy's visual representation

---

## 3. Components to Refactor

🔄 **Enhance (Not Replace)**:
1. `UserSelector.tsx` - Currently mocked, connect to real users
2. `Dashboard.tsx` - Integrate with real API
3. All data fetching - Replace with real API calls

🔄 **Add Integration**:
1. API service layer (already built in Step 2)
2. Hooks for data fetching (already built)
3. Store configuration (already built in Step 2)

---

## 4. Existing Deployment Workflow

**Current Pipeline**:
```
Push to main
    ↓
GitHub Actions triggers
    ↓
npm ci (install)
    ↓
npm run build (tsc + vite build)
    ↓
Upload dist/ to GitHub Pages
    ↓
Live at: https://emileeredpath.github.io/ai-office/
```

**Status**: ✅ Ready to use as-is

---

## 5. Current Routing Approach

**React Router Setup**:
```typescript
<BrowserRouter basename="/ai-office">
  <Routes>
    <Route path="/" element={<Dashboard />} />
  </Routes>
</BrowserRouter>
```

**Status**: ✅ Correct for GitHub Pages subdirectory

**To Add**:
- More routes for Sandy conversations
- Routes for knowledge base search
- Routes for AI employee profiles

---

## 6. Current Mock Data Locations

**Mock Data Files** (to replace):
- `src/store/appStore.ts` - Mock company/user state
- `src/hooks/useEmployees.ts` - Mock employee list
- `src/hooks/useTasks.ts` - Mock task data
- `src/hooks/useConversations.ts` - Mock conversations

**Status**: ✅ Already refactored in MVP to call real API

---

## 7. Backend Integration Points

**Already Built in MVP**:
- ✅ `src/services/api.ts` - All API functions
- ✅ `src/hooks/useEmployees.ts` - Data fetching
- ✅ `src/hooks/useTasks.ts` - Task management
- ✅ `src/hooks/useConversations.ts` - Chat integration
- ✅ `src/store/appStore.ts` - State management

**Configuration Needed**:
- Set `VITE_API_URL` environment variable
- Configure CORS on Railway backend
- Add error handling for offline backend

---

## 8. Migration Risks

### Low Risk ✅
- Adding new dependencies (already in package.json)
- Deploying to GitHub Pages (workflow exists)
- Frontend routing (already configured)

### Medium Risk ⚠️
- Backend connectivity (need Railway setup)
- Environment variables (need to configure in GitHub Actions)
- API response formats (may need adjustment)

### High Risk 🔴
- Data migration (none - fresh database)
- Breaking changes (none - greenfield backend)
- Downtime (can maintain old version temporarily)

---

## 9. Proposed Staging & Production Deployment

### Local Development
```
Frontend: http://localhost:5173
Backend: http://localhost:3001
Database: PostgreSQL in Docker
```

### Staging Environment
```
Frontend: GitHub Pages (staging branch or preview)
Backend: Railway staging service
Database: Railway staging PostgreSQL
```

### Production Environment
```
Frontend: https://emileeredpath.github.io/ai-office/ (main branch)
Backend: Railway production service
Database: Railway production PostgreSQL
```

---

## 10. Exact Steps to Upgrade Live Application

### Phase 1: Setup Backend Infrastructure (30 minutes)

1. **Create Railway account**
   - Sign up at railway.app
   - Link GitHub account

2. **Deploy backend to Railway**
   - Railway auto-deploys from git (backend/ folder)
   - Creates PostgreSQL database
   - Generates API URL

3. **Configure Railway environment variables**
   - `DATABASE_URL` (auto-created)
   - `ANTHROPIC_API_KEY` (paste your key)
   - `NODE_ENV=production`

### Phase 2: Update Frontend Configuration (15 minutes)

4. **Update GitHub Actions secrets**
   - Add `VITE_API_URL` to GitHub Actions secrets
   - Value: `https://your-backend.railway.app`

5. **Update vite.config.ts** (if needed)
   - Add environment variable handling
   - Ensure proper base path for GitHub Pages

6. **Test locally**
   ```bash
   VITE_API_URL=http://localhost:3001 npm run dev
   ```

### Phase 3: Safe Deployment (15 minutes)

7. **Create staging branch**
   - Branch: `staging`
   - Deploy staging frontend
   - Test with staging backend

8. **Run full test suite**
   - Task creation/management
   - Sandy chat functionality
   - Specialist AI delegation
   - Learning system tracking

9. **Create rollback branch**
   - Branch: `production-rollback`
   - Last known good version
   - Can switch to it if needed

10. **Deploy to production**
    - Merge staging → main
    - GitHub Actions auto-deploys
    - Live at: https://emileeredpath.github.io/ai-office/

### Phase 4: Monitor & Optimize (ongoing)

11. **Monitor deployment**
    - Check Railway logs
    - Monitor API response times
    - Track error rates

12. **Optimize as needed**
    - Cache frequently accessed data
    - Optimize database queries
    - Fine-tune AI prompts

---

## 11. Critical Configuration Files

### Environment Variables Needed

**Local Development** (`.env`):
```
VITE_API_URL=http://localhost:3001
NODE_ENV=development
```

**Production** (GitHub Actions Secret):
```
VITE_API_URL=https://your-railway-backend.railway.app
```

### Frontend Build Configuration

**vite.config.ts** (already correct):
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/ai-office/', // Correct for GitHub Pages
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
```

### Backend CORS Configuration

**Required in server.ts**:
```typescript
app.use(cors({
  origin: 'https://emileeredpath.github.io',
  credentials: true
}));
```

---

## 12. Deployment Checklist

- [ ] Railway account created
- [ ] Backend deployed to Railway
- [ ] PostgreSQL database created
- [ ] Environment variables set in Railway
- [ ] API key configured
- [ ] Frontend API URL configured
- [ ] GitHub Actions secrets added
- [ ] Local testing complete
- [ ] Staging environment tested
- [ ] Rollback branch created
- [ ] Production deployment ready
- [ ] Monitoring configured
- [ ] Team notified

---

## 13. Safe Rollback Procedure

If production deployment fails:

1. **Immediate Rollback**:
   ```bash
   git checkout production-rollback
   git push origin main -f
   ```
   GitHub Actions will auto-deploy old version

2. **Database Rollback**:
   - Railway keeps automated backups
   - Can restore previous database state
   - Usually within 24 hours

3. **API Rollback**:
   - Same process as frontend
   - Push old backend code to main
   - Railway auto-deploys

---

## 14. Success Criteria

✅ **Deployment is successful when**:
1. Frontend loads at https://emileeredpath.github.io/ai-office/
2. Can log in with user context
3. Dashboard displays real employee data
4. Can create and view tasks
5. Sandy chat responds with real API calls
6. Database persists data across sessions
7. Learning system tracks outcomes
8. No console errors or API failures

---

## 15. Timeline

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 1 | Railway setup | 5 min | Ready |
| 2 | Backend deployment | 10 min | Ready |
| 3 | Frontend config | 10 min | Ready |
| 4 | Testing | 30 min | Ready |
| 5 | Staging validation | 20 min | Pending |
| 6 | Production deploy | 5 min | Pending |
| 7 | Monitoring | Ongoing | Pending |

**Total Time**: ~1 hour from start to live

---

## Next Action

Begin Phase 1: **Setup Railway Backend**

This audit confirms:
✅ Existing frontend is properly configured  
✅ GitHub Pages deployment is ready  
✅ No breaking changes needed  
✅ Progressive migration path available  
✅ Rollback strategy in place  

**Proceed with Railway setup and backend deployment.**
