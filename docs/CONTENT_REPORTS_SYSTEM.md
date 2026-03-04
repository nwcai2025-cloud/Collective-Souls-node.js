# Content Reports System

## Overview

The Content Reports System is a comprehensive moderation feature that allows users to report inappropriate content and enables administrators to manage and review reports efficiently.

## Features

### User Features
- **Report Button**: Available on all content types (posts, comments, users, videos, chat messages)
- **Report Modal**: User-friendly interface for submitting detailed reports
- **Content Preview**: Shows the content being reported for context
- **Reason Selection**: Multiple predefined reasons for reporting
- **Description Field**: Free-form text for additional details
- **Guidelines**: Clear community guidelines displayed in the modal

### Admin Features
- **Admin Dashboard**: Complete interface for managing all reports
- **Report Status Tracking**: Pending, reviewed, resolved, dismissed
- **User Management**: View reports by user, content type, or status
- **Audit Trail**: Complete logging of all moderation actions
- **Notification System**: Real-time alerts for new reports

## Technical Implementation

### Backend Architecture

#### Models
- **ContentReport**: Main model for storing report data
  - Fields: reporter_id, reported_type, reported_id, reason, description, status, reviewed_by, reviewed_at, resolution_notes
  - Validation: Content type must be one of: post, comment, activity, user, video, chat_message
  - Status: pending, reviewed, resolved, dismissed

#### API Endpoints
- `POST /api/posts/report` - Submit a new report
- `GET /api/admin/reports` - Get all reports (admin only)
- `GET /api/admin/reports/user/:id` - Get reports for specific user (admin only)
- `PUT /api/admin/reports/:id/status` - Update report status (admin only)
- `DELETE /api/admin/reports/:id` - Delete report (admin only)

#### Security Features
- JWT authentication required for all endpoints
- Input validation and sanitization
- User permission checks
- Audit logging for all admin actions

### Frontend Architecture

#### Components
- **ReportButton**: Reusable component for all content types
- **Report Modal**: Comprehensive reporting interface
- **Report Service**: Dedicated service for report operations

#### Features
- Browser compatibility polyfills (crypto.randomUUID)
- Automatic token handling via axios interceptors
- Comprehensive error handling and user feedback
- Responsive design for mobile and desktop

## Usage

### For Users

1. Click the "Report" button on any content
2. Select a reason for reporting from the dropdown
3. Provide a detailed description of the issue
4. Submit the report
5. Reports are automatically routed to administrators

### For Administrators

1. Access the admin dashboard at `/admin/reports`
2. View all pending reports in the queue
3. Review report details and take appropriate action
4. Update report status and add resolution notes
5. Monitor user behavior patterns through analytics

## Content Types Supported

- **Posts**: Community wall posts
- **Comments**: Post comments
- **Users**: User profiles
- **Videos**: Video content
- **Chat Messages**: Chat conversations
- **Activities**: System activities

## Database Schema

```sql
CREATE TABLE content_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_id INTEGER NOT NULL,
    reported_type VARCHAR(50) NOT NULL,
    reported_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by INTEGER,
    reviewed_at DATETIME,
    resolution_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES admin_users(id)
);
```

## Error Handling

### Common Errors
- **401 Unauthorized**: User not authenticated
- **400 Bad Request**: Invalid input data
- **404 Not Found**: Content being reported doesn't exist
- **403 Forbidden**: User doesn't have permission
- **500 Internal Server Error**: Server-side issues

### Frontend Error Handling
- Toast notifications for user feedback
- Detailed error messages
- Graceful fallbacks for browser compatibility
- Loading states during submission

## Security Considerations

### Authentication
- All endpoints require valid JWT tokens
- Token validation on every request
- Automatic token refresh handling

### Authorization
- Users can only report content they have access to
- Admin actions require appropriate permissions
- Audit trail for all moderation activities

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Rate limiting considerations

## Testing

### Backend Tests
- Authentication middleware testing
- Input validation testing
- Database operation testing
- Error handling testing

### Frontend Tests
- Component rendering tests
- User interaction tests
- Error state tests
- Browser compatibility tests

## Future Enhancements

### Planned Features
- Report categorization and tagging
- Automated content analysis
- User reputation system
- Bulk report management
- Report analytics and reporting
- Integration with external moderation services

### Performance Optimizations
- Database indexing for large report volumes
- Caching for frequently accessed data
- Pagination for admin dashboard
- Background processing for report analysis

## Troubleshooting

### Common Issues
1. **Reports not appearing**: Check user permissions and content existence
2. **Authentication errors**: Verify JWT token validity
3. **Validation errors**: Check input format and content type
4. **Database errors**: Verify database connection and schema

### Debug Information
- Server logs contain detailed error information
- Frontend console shows API response details
- Network tab shows request/response data
- Database queries can be logged for debugging

## Integration

### With Existing Systems
- User authentication system integration
- Admin dashboard integration
- Notification system integration
- Audit logging integration

### API Integration
- RESTful API design
- JSON request/response format
- Standard HTTP status codes
- CORS support for frontend applications

## Maintenance

### Regular Tasks
- Monitor report queue for pending items
- Review and update moderation guidelines
- Analyze report patterns and trends
- Update content type definitions as needed

### Database Maintenance
- Regular backup of report data
- Cleanup of resolved reports (optional)
- Index optimization for performance
- Schema updates for new features

## Support

For issues or questions about the Content Reports System:

1. Check the troubleshooting section above
2. Review server and browser console logs
3. Verify database connectivity and permissions
4. Contact the development team with detailed error information

---

**Last Updated**: February 26, 2026
**Version**: 1.0
**Status**: Production Ready