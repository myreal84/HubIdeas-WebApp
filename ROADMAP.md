# Roadmap 🗺️

## 🚑 Phase 1: Stabilization & Bugfixes (Immediate)
Focus on reliability and user experience on mobile devices.

- [ ] **Fix Mobile Chat View**:
    - [ ] Ensure chat input is always visible (sticky bottom).
    - [ ] Fix overlay/z-index issues on small screens.
    - [ ] Verify scrolling behavior when keyboard opens.
- [ ] **Fix Login Status Check**:
    - [ ] Diagnostics: Why does status check fail after login? (Redirect loops? Session latency?)
    - [ ] Implement robust redirection for "WAITING" vs "APPROVED" users.

## 📱 Phase 2: Mobile Excellence (PWA)
Make the app feel native on smartphones.

- [ ] **PWA Polish**:
    - [ ] Optimize "Add to Home Screen" prompt.
    - [ ] Review Manifest (Icons, Name, Theme Colors).
- [ ] **Offline Resilience**:
    - [ ] Enhance Service Worker caching for core assets.
    - [ ] Basic offline support for reading notes/todos.

## 🔔 Phase 3: Engagement & Notification
Refine how the app brings users back.

- [ ] **Smart Resurfacing**:
    - [ ] User settings for notification frequency (e.g., "Remind me only on weekends").
    - [ ] "Snooze" functionality for projects.
- [ ] **Advanced Push**:
    - [ ] Actionable notifications (e.g., "Add thought directly from notification").

## 🛠️ Phase 4: Power Features
Tools for power users and admins.

- [ ] **Global Search**:
    - [ ] Full-text search across all Projects, Notes, and Todos.
    - [ ] Quick-jump navigation (Cmd+K).
- [ ] **Admin Dashboard 2.0**:
    - [ ] Edit individual AI token limits per user.
    - [ ] View aggregated system usage stats.
