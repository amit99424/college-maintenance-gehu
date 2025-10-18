# TODO: Add Mark as Read in Notifications

## Information Gathered
- Notifications components exist for student, staff, supervisor, and admin dashboards.
- All components have similar structure: list notifications, click to open dialog (which marks as read), and "Mark all as read" button.
- No individual "Mark as read" button on each notification item in the list.
- NotificationDropdown.js is a separate component (possibly for header bell) but not currently used and lacks mark as read functionality.

## Plan
- Add a "Mark as read" button to each unread notification item in the list across all dashboard Notifications components.
- The button will call the existing `markAsRead(id)` function and prevent event propagation to avoid opening the dialog.
- Keep the existing click behavior on the notification item to open the dialog (which also marks as read).
- This provides users with an option to mark as read without opening the details dialog.

## Dependent Files to Edit
- college-maintenance/src/app/student-dashboard/components/Notifications.tsx
- college-maintenance/src/app/staff-dashboard/components/Notifications.tsx
- college-maintenance/src/app/supervisor-dashboard/components/Notifications.tsx
- college-maintenance/src/app/admin-dashboard/components/Notifications.tsx

## Followup Steps
- Test the changes by running the application and verifying notifications can be marked as read individually.
- Ensure Firebase updates work correctly and UI reflects changes immediately.
- Check responsiveness on different screen sizes.
