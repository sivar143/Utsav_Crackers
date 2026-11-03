# Fireworks jurisdiction policy controls

The compliance module is deliberately **default-deny**. It does not infer that fireworks may be sold, stored, transported, or delivered in a location. A jurisdiction without an approved and currently effective policy is blocked at the eligibility-check stage.

## Administrator workflow

1. Create a draft jurisdiction policy for a state, district, or six-digit PIN code.
2. Include a source reference to the applicable official order, notification, licence condition, or other reviewed legal instrument, plus legal notes and an effective period.
3. A different administrator must approve the draft. The creator cannot approve their own policy.
4. Overlapping approved policies for the same scope and effective period are rejected.
5. Revoke an approved policy with a recorded reason when it is superseded or withdrawn; the revoking administrator and timestamp are audited. Create a new policy version for future effective dates.

## API endpoints

- `GET /api/v1/admin/compliance/policies`
- `POST /api/v1/admin/compliance/policies`
- `PUT /api/v1/admin/compliance/policies/{id}/approve`
- `PUT /api/v1/admin/compliance/policies/{id}/revoke`
- `POST /api/v1/customer/compliance/eligibility-check` with `{"addressId":"..." }`

The eligibility check selects the most specific approved and effective policy: PIN code, then district, then state. It returns separate sale, delivery, transport, and storage flags. Checkout eligibility requires sale, delivery, and transport permission.

## Important limits

This is a policy execution framework, not a legal database or legal opinion. No real jurisdiction policies are seeded. Before use, an authorized compliance reviewer must enter and approve rules from current official sources. Product-specific restrictions, warehouse licensing/capacity, carrier-specific dangerous-goods rules, local temporary orders, and product classification checks remain required before checkout or dispatch. A positive address-level check alone never guarantees a sale or shipment.
