# Data Model: Connection Visibility

## Updated Entities

### Connection
Existing entity updated with `accountId`.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `accountId` | `string` | ID of the organization/account this connection belongs to. | Required, MUST match the `accountId` of the `teamId`. |

### User
Existing entity updated with `privacyTier` and `role`.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `privacyTier` | `PrivacyTier` | User's privacy setting (TIER_1, TIER_2, TIER_3). | Default to `TIER_1` (Standard). |
| `role` | `string` | User's role (owner, account_admin, member). | Role `account_admin` is account-level. |

## Relationships

- **Account** (1) ↔ (N) **Connection**
- **User** (1) ↔ (N) **Connection** (as participant)
- **Team** (1) ↔ (N) **Connection**

## Security Rules (Logical)

- **Read (Metadata - Existence on Graph)**:
  - `Allow read if user.role == 'owner' || user.role == 'account_admin'` AND `resource.data.accountId == user.accountId`.
  - `Allow read if resource.data.proposerId == user.id || resource.data.confirmerId == user.id`.
- **Read (Detailed Content - Summary/Transcript)**:
  - `Allow read if (user.role == 'owner' || user.role == 'account_admin')` AND `resource.data.accountId == user.accountId` AND **(ALL participants' privacyTier allows sharing)**.
  - `Allow read if resource.data.proposerId == user.id || resource.data.confirmerId == user.id`. (Participants always see full details).
- **Create**:
  - `Allow create if request.resource.data.accountId == user.accountId`.
