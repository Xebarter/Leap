// ============================================================================
// PAYMENT TYPES AND INTERFACES
// ============================================================================

export type PaymentProvider = 'airtel' | 'mtn'
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled'
export type PaymentMethod = 'mobile_money' | 'bank_transfer' | 'card' | 'cash'

// Payment request interface
export interface PaymentRequest {
  amount: number // Amount in UGX
  phoneNumber: string // Format: 256XXXXXXXXX
  propertyCode: string // 10-digit property/unit number
  provider: PaymentProvider
  email?: string
  firstName?: string
  lastName?: string
  description?: string
  reference?: string // Internal reference
}

// Payment response interface
export interface PaymentResponse {
  success: boolean
  transactionId: string
  providerTransactionId?: string
  status: PaymentStatus
  message: string
  paymentUrl?: string // For redirect-based flows
  data?: any
}

// Payment verification interface
export interface PaymentVerification {
  transactionId: string
  status: PaymentStatus
  amount: number
  currency: string
  providerTransactionId: string
  providerReference?: string
  completedAt?: Date
  failureReason?: string
}

// Airtel Money specific types
export interface AirtelAuthResponse {
  access_token: string
  expires_in: number
  token_type: string
}

export interface AirtelPaymentRequest {
  reference: string // Unique transaction reference
  subscriber: {
    country: string // ISO country code (e.g., "UG")
    currency: string // Currency code (e.g., "UGX")
    msisdn: string // Phone number without country code
  }
  transaction: {
    amount: number
    country: string
    currency: string
    id: string // Merchant transaction ID
  }
}

export interface AirtelPaymentResponse {
  data: {
    transaction: {
      id: string // Airtel transaction ID
      status: string
    }
  }
  status: {
    code: string
    message: string
    success: boolean
  }
}

// MTN Mobile Money specific types
export interface MTNPaymentRequest {
  amount: string
  currency: string // "EUR" or "UGX"
  externalId: string // Merchant reference
  payer: {
    partyIdType: string // "MSISDN"
    partyId: string // Phone number
  }
  payerMessage: string
  payeeNote: string
}

export interface MTNPaymentResponse {
  referenceId: string // UUID for the transaction
  status: string
}

export interface MTNTransactionStatus {
  amount: string
  currency: string
  financialTransactionId: string
  externalId: string
  payer: {
    partyIdType: string
    partyId: string
  }
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED'
  reason?: string
}

// Database payment record
export interface PaymentTransaction {
  id: string
  transaction_id: string
  invoice_id?: string
  booking_id?: string
  reservation_id?: string
  tenant_id: string
  property_code: string // 10-digit unique identifier
  amount_paid_ugx: number
  currency: string
  payment_date: Date
  payment_method: PaymentMethod
  provider?: PaymentProvider
  provider_transaction_id?: string
  provider_reference?: string
  status: PaymentStatus
  description?: string
  notes?: string
  phone_number?: string
  email?: string
  created_at: Date
  updated_at: Date
}

// Webhook payload types
export interface AirtelWebhookPayload {
  transaction: {
    id: string
    status: string
    message: string
  }
  reference: string
}

export interface MTNWebhookPayload {
  referenceId: string
  status: string
  externalId: string
  amount: string
  currency: string
  financialTransactionId: string
  reason?: string
}
