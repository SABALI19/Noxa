# Noxa Features

## Overview

Noxa is an AI-first productivity workspace that combines planning, execution, reminders, notes, notifications, and voice interaction in one application.

The product is designed to help users:

- capture work quickly
- organize goals, tasks, reminders, and notes in one place
- receive proactive guidance from an embedded AI assistant
- stay informed with live notifications and sound-based alerts
- interact with the workspace using both text and voice

---

## Core Workspace

### Dashboard

- Personalized dashboard experience after login
- Smart briefing popup with reminders, urgent items, top goals, and AI suggestions
- Recent activity feed connected to in-app notification history
- AI assistant control card for quick access
- Word of the Day and community word contribution flow
- Quick links into goals, tasks, reminders, calendar, and notes

### Goals Management

- Create, edit, and view goals
- Goal detail pages
- Goal progress tracking pages
- Priority support
- Categories and target dates
- Milestones, notes, and progress history
- Goal hydration from backend plus local persistence

### Task Management

- Dedicated task workspace
- Task status handling including pending, in progress, completed, and overdue states
- Task summary cards and progress indicators
- AI-assisted task creation and completion support
- Goal-linked task creation support
- Duplicate task prevention in AI-assisted flows

### Reminders

- Dedicated reminders page
- Reminder creation and scheduling
- Due-now and overdue awareness
- Reminder routing from notifications
- Reminder support in smart briefing summaries
- Reminder-aware AI action generation

### Notes

- Notes page for stored knowledge and personal capture
- AI can create notes from chat requests
- Note-aware workspace context for the AI assistant

### Calendar

- Calendar page integration
- Reminder and schedule visibility through calendar-related navigation
- Calendar access from dashboard and sidebar

---

## AI Features

### Embedded AI Assistant

- Persistent in-app AI assistant available across the protected workspace
- Streaming AI responses
- Stop/cancel response support with `AbortController`
- Chat session support and conversation context handling
- Workspace-aware prompting using tasks, goals, reminders, notes, current page, and message history
- Follow-up suggestions returned with AI responses

### AI Actions

- AI can generate structured actions from natural language
- Supported AI actions include:
  - create task
  - create goal
  - create reminder
  - create note
  - complete task
  - complete goal
  - prepare email actions

### Direct Command Handling

- Direct interpretation of certain user intents without requiring a full model round-trip
- Fast handling for task and reminder-style commands
- Automatic category inference for tasks
- Goal linking when task requests clearly reference goals
- Duplicate title avoidance for task creation

### AI Insights

- AI insights component for workspace analysis and suggestions
- Prediction-style recommendations based on user data
- Insight dismissal support

---

## Voice Features

### Voice Chat

- Speech-to-text input for the AI assistant
- Text-to-speech output for AI responses
- Voice selection support
- Adjustable voice rate, pitch, and volume
- Auto-speak option where browser/platform policy allows it
- Manual stop for spoken output

### Platform-Aware Voice Handling

- iOS-specific safety handling for Web Speech limitations
- Desktop-mode iPad detection support
- Auto-speak restrictions respected on iOS
- iOS-specific speech timing and playback handling
- Android and desktop-friendly voice behavior where supported

### Voice Notifications

- Spoken smart briefing support
- Spoken reminder support
- AI-generated reminder voice text where available
- Manual “tap to hear” style fallback for iOS-style restrictions

---

## Notifications

### In-App Notifications

- Central notifications system with provider-based state management
- Notification bell dropdown
- Dedicated notifications page
- Read/unread tracking
- Mark all as read
- Clear individual notifications
- Clear all notifications
- Notification-to-origin navigation support

### Realtime Notifications

- Socket-based notification listener
- Notification payload normalization
- Realtime notification insertion into app state
- Origin-path routing for tasks, goals, reminders, notes, account, and general notifications

### Browser and Push Notifications

- Browser notification support
- Push notification subscription support
- Service-worker-aware notification handling
- Open-app follow-through behavior for notification actions

### Notification Sound System

- Sound-enabled notifications
- Mute and unmute controls
- Snooze notification sound support
- Resume sound after snooze
- Selected ringtone persistence
- Notification-type-based sound routing
- Preview support for ringtone settings

---

## Tracking and Analytics

### Goal Tracking

- Goal tracking detail views
- Progress charts using Recharts
- Notification interaction tracking for goals
- Progress update history
- Exportable tracking data support

### Task Tracking

- Task tracking detail views
- Notification history for tasks
- Completion and view timing insights
- Chart-based activity visualization

### Analytics Foundations

- Analytics route exists in the app structure
- Task, goal, reminder, and notification tracking components are present
- Insight and progress components already provide a strong analytics foundation for expansion

---

## Customization and Settings

### Appearance

- Dark mode support
- Appearance route
- Sidebar dark mode controls

### Notification Preferences

- Notification settings storage and persistence
- Sound preferences
- Push notification toggles
- Custom ringtone support

### Voice Preferences

- Voice selection persistence
- Voice output controls for assistant and notification flows

---

## Account and Profile

- Authentication-protected workspace
- Login and landing flow
- Account page
- Profile editing
- Username, name, and email display/edit support
- Avatar upload
- Avatar cropping
- Generated avatar selection using DiceBear
- Account deletion flow

---

## Navigation and UX

- Protected route system
- Shared layout across the authenticated app
- Responsive sidebar and task sidebar variants
- Mobile-aware UI behavior
- Scroll-to-top behavior on route changes
- Responsive notification dropdown
- Smart briefing modal with responsive behavior

---

## PWA and App-Like Features

- Install prompt support
- Progressive Web App style onboarding behavior
- Service-worker-connected notification flow
- More app-like behavior on supported devices

---

## Reliability and Productivity Enhancements

- Local caching and persistence for multiple feature areas
- Backend hydration for goals and notifications
- Graceful fallbacks for offline or failed data fetch paths in several flows
- Real-time plus local-state hybrid behavior for responsive UI updates
- Production build optimization with chunk splitting

---

## Product Differentiators

- AI assistant built directly into the workspace instead of being a separate chat tool
- AI actions that can create or update real productivity items
- Voice interaction layered into both assistant and notification experiences
- Smart briefing that proactively summarizes the user’s day
- Rich notification system with sockets, sounds, push support, and routing
- Unified workspace across goals, tasks, reminders, notes, and calendar

---

## Short Product Pitch

Noxa is a smart productivity workspace that helps users plan, act, remember, and respond in one place. It combines goal tracking, tasks, reminders, notes, real-time notifications, voice interaction, and an embedded AI assistant that can understand context and take action.
