# API Endpoints Implementation Guide

This guide outlines all the API endpoints needed to support the complete property management system with properties, tenants, payments, and maintenance schemas.

## Base URL
```
/api/v1
```

---

## 1. AUTHENTICATION ENDPOINTS

### Register/Sign Up
```
POST /api/v1/auth/signup
Body: {
  email: string
  password: string
  full_name: string
  role: 'tenant' | 'admin' | 'landlord'
}
Response: { user, session, profile }
```

### Login
```
POST /api/v1/auth/login
Body: { email: string, password: string }
Response: { user, session }
```

### Logout
```
POST /api/v1/auth/logout
Response: { success: boolean }
```

### Get Current User
```
GET /api/v1/auth/me
Response: { user, profile }
```

---

## 2. PROFILES ENDPOINTS

### Get Profile
```
GET /api/v1/profiles/:userId
Response: { id, full_name, email, is_admin, role, avatar_url, created_at }
```

### Update Profile
```
PUT /api/v1/profiles/:userId
Body: { full_name?, avatar_url?, phone_number?, bio? }
Response: { success: boolean, profile }
```

### Get All Profiles (Admin Only)
```
GET /api/v1/profiles?role=tenant&limit=20&offset=0
Response: { profiles: [], total, hasMore }
```

---

## 3. PROPERTIES ENDPOINTS

### List Properties
```
GET /api/v1/properties?category=Apartment&location=Kampala&limit=20&offset=0&minPrice=1000000&maxPrice=5000000
Response: { properties: [], total, hasMore }
```

### Get Property Details
```
GET /api/v1/properties/:propertyId
Response: { 
  property with images, details, units, ratings, reviews_count, availability 
}
```

### Create Property (Admin/Landlord Only)
```
POST /api/v1/properties
Body: {
  title, description, location, price_ugx, bedrooms, bathrooms, 
  category, amenities[], square_feet, total_floors, video_url, 
  minimum_initial_months, block_id?
}
Response: { success: boolean, property }
```

### Update Property
```
PUT /api/v1/properties/:propertyId
Body: { title?, description?, price_ugx?, bedrooms?, ... }
Response: { success: boolean, property }
```

### Delete Property (Admin Only)
```
DELETE /api/v1/properties/:propertyId
Response: { success: boolean }
```

### Search Properties
```
GET /api/v1/properties/search?query=master+bedroom&filters=amenities,location
Response: { properties: [] }
```

---

## 4. PROPERTY IMAGES ENDPOINTS

### Upload Property Image
```
POST /api/v1/properties/:propertyId/images
Body: FormData { image: File, area: string, is_primary?: boolean }
Response: { success: boolean, image: { id, url, area, display_order } }
```

### Get Property Images
```
GET /api/v1/properties/:propertyId/images?area=Kitchen
Response: { images: [] }
```

### Set Primary Image
```
PUT /api/v1/properties/:propertyId/images/:imageId/set-primary
Response: { success: boolean }
```

### Delete Image
```
DELETE /api/v1/properties/:propertyId/images/:imageId
Response: { success: boolean }
```

### Reorder Images
```
PUT /api/v1/properties/:propertyId/images/reorder
Body: { images: [{ id, display_order }] }
Response: { success: boolean }
```

---

## 5. PROPERTY DETAILS ENDPOINTS

### List Property Details
```
GET /api/v1/properties/:propertyId/details
Response: { details: [] }
```

### Create Detail
```
POST /api/v1/properties/:propertyId/details
Body: { detail_name, detail_type, description?, display_order? }
Response: { success: boolean, detail }
```

### Update Detail
```
PUT /api/v1/properties/:propertyId/details/:detailId
Body: { detail_name?, description?, display_order? }
Response: { success: boolean, detail }
```

### Delete Detail
```
DELETE /api/v1/properties/:propertyId/details/:detailId
Response: { success: boolean }
```

---

## 6. PROPERTY IMAGES FOR DETAILS ENDPOINTS

### Upload Detail Image
```
POST /api/v1/properties/:propertyId/details/:detailId/images
Body: FormData { image: File, display_order?: number }
Response: { success: boolean, image }
```

### Get Detail Images
```
GET /api/v1/properties/:propertyId/details/:detailId/images
Response: { images: [] }
```

### Delete Detail Image
```
DELETE /api/v1/properties/:propertyId/details/:detailId/images/:imageId
Response: { success: boolean }
```

---

## 7. PROPERTY BLOCKS ENDPOINTS

### List Property Blocks
```
GET /api/v1/property-blocks?location=Kampala&limit=20
Response: { blocks: [], total }
```

### Get Block Details
```
GET /api/v1/property-blocks/:blockId
Response: { block with units summary }
```

### Create Block (Admin Only)
```
POST /api/v1/property-blocks
Body: { name, location, description?, total_floors?, total_units? }
Response: { success: boolean, block }
```

### Update Block
```
PUT /api/v1/property-blocks/:blockId
Body: { name?, location?, description? }
Response: { success: boolean, block }
```

---

## 8. PROPERTY UNITS ENDPOINTS

### List Units in Block
```
GET /api/v1/property-blocks/:blockId/units?floor=1&available=true
Response: { units: [] }
```

### Get Unit Details
```
GET /api/v1/property-units/:unitId
Response: { unit with availability status }
```

### Create Unit (Admin Only)
```
POST /api/v1/property-blocks/:blockId/units
Body: {
  property_id, floor_number, unit_number, unit_type,
  bedrooms, bathrooms, square_feet, is_available
}
Response: { success: boolean, unit }
```

### Update Unit
```
PUT /api/v1/property-units/:unitId
Body: { bedrooms?, bathrooms?, is_available?, reserved_until? }
Response: { success: boolean, unit }
```

---

## 9. BOOKINGS ENDPOINTS

### List Bookings
```
GET /api/v1/bookings?status=confirmed&limit=20
Response: { bookings: [] }
```

### Get Booking Details
```
GET /api/v1/bookings/:bookingId
Response: { booking with property, tenant, unit details }
```

### Create Booking
```
POST /api/v1/bookings
Body: {
  property_id, unit_id?, check_in: date, check_out: date,
  number_of_guests?, notes?
}
Response: { success: boolean, booking }
```

### Update Booking Status
```
PUT /api/v1/bookings/:bookingId/status
Body: { status: 'confirmed' | 'cancelled' | 'active' | 'completed' }
Response: { success: boolean, booking }
```

### Cancel Booking
```
POST /api/v1/bookings/:bookingId/cancel
Body: { reason: string }
Response: { success: boolean }
```

---

## 10. TENANT PROFILES ENDPOINTS

### Get Tenant Profile
```
GET /api/v1/tenants/profile
Response: { tenant_profile with KYC info }
```

### Update Tenant Profile
```
PUT /api/v1/tenants/profile
Body: {
  phone_number?, date_of_birth?, national_id?, national_id_type?,
  home_address?, employment_status?, employer_name?, monthly_income_ugx?
}
Response: { success: boolean, profile }
```

### Get Tenant Dashboard
```
GET /api/v1/tenants/dashboard
Response: {
  active_bookings, pending_payments, unread_notices, 
  open_complaints, total_balance_due_ugx, overdue_payments_count
}
```

---

## 11. TENANT DOCUMENTS ENDPOINTS

### List Tenant Documents
```
GET /api/v1/tenants/documents?status=approved
Response: { documents: [] }
```

### Upload Document
```
POST /api/v1/tenants/documents
Body: FormData {
  document_type, document_file: File, expiry_date?
}
Response: { success: boolean, document }
```

### Get Document
```
GET /api/v1/tenants/documents/:documentId
Response: { document }
```

### Delete Document
```
DELETE /api/v1/tenants/documents/:documentId
Response: { success: boolean }
```

---

## 12. TENANT REFERENCES ENDPOINTS

### List References
```
GET /api/v1/tenants/references
Response: { references: [] }
```

### Add Reference
```
POST /api/v1/tenants/references
Body: {
  reference_type, reference_name, reference_title?,
  reference_company?, reference_email, reference_phone
}
Response: { success: boolean, reference }
```

### Update Reference
```
PUT /api/v1/tenants/references/:referenceId
Body: { reference_name?, reference_email?, reference_phone? }
Response: { success: boolean, reference }
```

### Delete Reference
```
DELETE /api/v1/tenants/references/:referenceId
Response: { success: boolean }
```

---

## 13. TENANT NOTICES ENDPOINTS

### List Notices
```
GET /api/v1/tenants/notices?status=sent&limit=20
Response: { notices: [] }
```

### Get Notice
```
GET /api/v1/tenants/notices/:noticeId
Response: { notice }
```

### Mark Notice as Read
```
PUT /api/v1/tenants/notices/:noticeId/mark-read
Response: { success: boolean }
```

### Acknowledge Notice
```
PUT /api/v1/tenants/notices/:noticeId/acknowledge
Response: { success: boolean }
```

### Create Notice (Admin/Host Only)
```
POST /api/v1/tenants/notices
Body: {
  tenant_id, notice_type, title, description,
  effective_date?, expiry_date?, priority?, requires_acknowledgment?
}
Response: { success: boolean, notice }
```

---

## 14. TENANT COMPLAINTS ENDPOINTS

### List Complaints
```
GET /api/v1/tenants/complaints?status=open&priority=high
Response: { complaints: [] }
```

### Get Complaint
```
GET /api/v1/tenants/complaints/:complaintId
Response: { complaint }
```

### Create Complaint
```
POST /api/v1/tenants/complaints
Body: {
  complaint_type, title, description, priority?,
  attachments?: [urls]
}
Response: { success: boolean, complaint }
```

### Update Complaint (Admin Only)
```
PUT /api/v1/tenants/complaints/:complaintId
Body: { status?, assigned_to?, resolution_notes? }
Response: { success: boolean, complaint }
```

---

## 15. PAYMENTS ENDPOINTS

### List Invoices
```
GET /api/v1/payments/invoices?status=overdue&limit=20
Response: { invoices: [] }
```

### Get Invoice
```
GET /api/v1/payments/invoices/:invoiceId
Response: { invoice }
```

### Create Invoice (Admin Only)
```
POST /api/v1/payments/invoices
Body: {
  booking_id, invoice_date, due_date, subtotal_ugx,
  tax_amount_ugx?, discount_amount_ugx?, items: [...]
}
Response: { success: boolean, invoice }
```

### Download Invoice
```
GET /api/v1/payments/invoices/:invoiceId/download
Response: PDF file
```

---

## 16. PAYMENT METHODS ENDPOINTS

### List Payment Methods
```
GET /api/v1/payments/methods
Response: { methods: [] }
```

### Add Payment Method
```
POST /api/v1/payments/methods
Body: {
  method_type, bank_name?, account_number?, mobile_provider?,
  mobile_number?, card_last_four?, is_default?
}
Response: { success: boolean, method }
```

### Set Default Payment Method
```
PUT /api/v1/payments/methods/:methodId/set-default
Response: { success: boolean }
```

### Delete Payment Method
```
DELETE /api/v1/payments/methods/:methodId
Response: { success: boolean }
```

---

## 17. PAYMENT TRANSACTIONS ENDPOINTS

### List Transactions
```
GET /api/v1/payments/transactions?status=completed&limit=20
Response: { transactions: [] }
```

### Create Payment
```
POST /api/v1/payments/transactions
Body: {
  invoice_id, amount_paid_ugx, payment_method,
  payment_method_id?, provider?, provider_transaction_id?
}
Response: { success: boolean, transaction }
```

### Get Transaction
```
GET /api/v1/payments/transactions/:transactionId
Response: { transaction }
```

---

## 18. RECEIPTS ENDPOINTS

### List Receipts
```
GET /api/v1/payments/receipts?limit=20
Response: { receipts: [] }
```

### Get Receipt
```
GET /api/v1/payments/receipts/:receiptId
Response: { receipt }
```

### Download Receipt
```
GET /api/v1/payments/receipts/:receiptId/download
Response: PDF file
```

---

## 19. REFUNDS ENDPOINTS

### List Refunds
```
GET /api/v1/payments/refunds?status=completed
Response: { refunds: [] }
```

### Create Refund (Admin Only)
```
POST /api/v1/payments/refunds
Body: {
  payment_transaction_id, refund_amount_ugx, reason
}
Response: { success: boolean, refund }
```

### Get Refund
```
GET /api/v1/payments/refunds/:refundId
Response: { refund }
```

---

## 20. PAYMENT SCHEDULES ENDPOINTS

### List Payment Schedules
```
GET /api/v1/payments/schedules
Response: { schedules: [] }
```

### Create Schedule
```
POST /api/v1/payments/schedules
Body: {
  booking_id, schedule_name, amount_ugx, frequency,
  start_date, end_date?, auto_payment_enabled?
}
Response: { success: boolean, schedule }
```

### Update Schedule
```
PUT /api/v1/payments/schedules/:scheduleId
Body: { amount_ugx?, frequency?, next_payment_date?, is_active? }
Response: { success: boolean, schedule }
```

### Delete Schedule
```
DELETE /api/v1/payments/schedules/:scheduleId
Response: { success: boolean }
```

---

## 21. MAINTENANCE REQUESTS ENDPOINTS

### List Maintenance Requests
```
GET /api/v1/maintenance/requests?status=open&severity=high
Response: { requests: [] }
```

### Create Maintenance Request
```
POST /api/v1/maintenance/requests
Body: {
  title, description, severity?, location_in_property?,
  category_id?, attachments?: [urls]
}
Response: { success: boolean, request }
```

### Get Request Details
```
GET /api/v1/maintenance/requests/:requestId
Response: { request }
```

### Update Request Status
```
PUT /api/v1/maintenance/requests/:requestId/status
Body: { status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' }
Response: { success: boolean, request }
```

---

## 22. WORK ORDERS ENDPOINTS

### List Work Orders
```
GET /api/v1/maintenance/work-orders?status=in_progress&assigned_to=staffId
Response: { work_orders: [] }
```

### Create Work Order (Admin Only)
```
POST /api/v1/maintenance/work-orders
Body: {
  maintenance_request_id, title, description, priority?,
  estimated_hours?, estimated_cost_ugx?, assigned_to?
}
Response: { success: boolean, work_order }
```

### Get Work Order
```
GET /api/v1/maintenance/work-orders/:workOrderId
Response: { work_order }
```

### Update Work Order
```
PUT /api/v1/maintenance/work-orders/:workOrderId
Body: {
  status?, assigned_to?, actual_hours?, actual_cost_ugx?,
  completion_notes?, tenant_sign_off?
}
Response: { success: boolean, work_order }
```

---

## 23. MAINTENANCE ASSETS ENDPOINTS

### List Assets
```
GET /api/v1/maintenance/assets?property_id=propId&status=active
Response: { assets: [] }
```

### Create Asset (Admin Only)
```
POST /api/v1/maintenance/assets
Body: {
  property_id, asset_name, asset_type, brand?, model?,
  serial_number?, purchase_date, installation_date?,
  warranty_end_date?, purchase_cost_ugx?
}
Response: { success: boolean, asset }
```

### Get Asset Details
```
GET /api/v1/maintenance/assets/:assetId
Response: { asset with maintenance history }
```

### Update Asset
```
PUT /api/v1/maintenance/assets/:assetId
Body: { status?, last_maintenance_date? }
Response: { success: boolean, asset }
```

---

## 24. PREVENTIVE MAINTENANCE ENDPOINTS

### List Schedules
```
GET /api/v1/maintenance/schedules?is_active=true&upcoming=true
Response: { schedules: [] }
```

### Create Schedule (Admin Only)
```
POST /api/v1/maintenance/schedules
Body: {
  property_id, asset_id?, task_name, task_type, frequency,
  start_date, estimated_hours?, estimated_cost_ugx?
}
Response: { success: boolean, schedule }
```

### Update Schedule
```
PUT /api/v1/maintenance/schedules/:scheduleId
Body: { next_due_date?, is_active? }
Response: { success: boolean, schedule }
```

---

## 25. MAINTENANCE HISTORY ENDPOINTS

### List History
```
GET /api/v1/maintenance/history?property_id=propId&asset_id=assetId
Response: { history: [] }
```

### Create History Entry (Admin/Staff Only)
```
POST /api/v1/maintenance/history
Body: {
  work_order_id?, property_id, asset_id?, performed_by,
  maintenance_type, description, work_date, duration_hours,
  cost_ugx?, issues_found?, issues_fixed?, parts_used?: []
}
Response: { success: boolean, history }
```

---

## 26. MAINTENANCE INVOICES ENDPOINTS

### List Maintenance Invoices
```
GET /api/v1/maintenance/invoices?status=sent
Response: { invoices: [] }
```

### Create Invoice (Admin Only)
```
POST /api/v1/maintenance/invoices
Body: {
  work_order_id, labor_cost_ugx, materials_cost_ugx?,
  tax_amount_ugx?, discount_amount_ugx?, notes?
}
Response: { success: boolean, invoice }
```

---

## 27. ADMIN DASHBOARD ENDPOINTS

### Dashboard Summary
```
GET /api/v1/admin/dashboard
Response: {
  total_properties, total_tenants, total_bookings,
  total_revenue_ugx, pending_maintenance, overdue_payments
}
```

### Properties Analytics
```
GET /api/v1/admin/analytics/properties
Response: {
  by_category, by_location, occupancy_rate, revenue_trend
}
```

### Payments Analytics
```
GET /api/v1/admin/analytics/payments
Response: {
  total_revenue, payment_methods_breakdown, overdue_summary
}
```

### Maintenance Analytics
```
GET /api/v1/admin/analytics/maintenance
Response: {
  total_requests, by_type, staff_performance, costs_summary
}
```

---

## 28. SEARCH & FILTER ENDPOINTS

### Advanced Search
```
GET /api/v1/search?q=query&type=properties|tenants|bookings&filters=...
Response: { results: [] }
```

### Get Available Properties
```
GET /api/v1/properties/available?check_in=2024-01-20&check_out=2024-02-20
Response: { properties: [] }
```

---

## Error Handling

All endpoints should return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Authentication

All endpoints (except auth/signup, auth/login) require:
```
Headers: {
  Authorization: "Bearer <token>"
}
```

## Rate Limiting

- Standard: 100 requests/minute
- Admin: 500 requests/minute

---

This guide covers 28 main endpoint categories with 100+ individual endpoints needed for a complete property management system.
