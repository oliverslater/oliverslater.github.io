# Credentials & Certifications Management Guide

This website automatically synchronizes, normalizes, and renders Oliver Slater's verified credentials from multiple authoritative sources into a single unified DarkMinimal layout.

---

## 1. Data Sources & Architecture

```
External Feeds
├── Credly Public API (https://www.credly.com/users/oliver-slater/badges.json)
└── Microsoft Learn API (https://learn.microsoft.com/api/profiles/transcript/share/d5on2cqnl3lgknq)

Local Files
├── src/content/cv/manual-certifications.json   # Non-Credly / non-Microsoft credentials
├── src/content/cv/certification-settings.json  # Visibility, count, and priority overrides
└── src/content/cv/education.json               # Offline fallback credentials
```

The build pipeline in [`src/utils/certifications.ts`](file:///Users/oliverslater/Downloads/Repo/oliverslater.github.io/oliverslater.github.io/src/utils/certifications.ts):
1. Dynamically pulls from Credly and Microsoft Learn.
2. Merges with any manual credentials in `manual-certifications.json`.
3. Automatically excludes expired certifications.
4. Applies user overrides from `certification-settings.json`.
5. Sorts credentials by priority, then by newest issue date.

---

## 2. Managing Overrides (`certification-settings.json`)

To customize how ANY certification is displayed (regardless of whether it came from Credly, Microsoft Learn, or manual entries), add an override entry to `src/content/cv/certification-settings.json`:

### Feature Toggles

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | *(required)* | Matches certification title exactly or by substring (case-insensitive). |
| `displayed` | `boolean` | `true` | Set `false` to hide the credential card from the visible grid on `/cv`. |
| `includeInCount` | `boolean` | `true` | Set `false` to omit from the headline counter badge (e.g. `54 verified credentials`). |
| `priority` | `number` | `0` | Higher numbers display first. E.g. `10` floats to the top; `-1` pushes to the bottom. |
| `order` | `number` | *(optional)* | Friendly ranking alias: `order: 1` = 1st, `order: 2` = 2nd. |

### Copy-Pasteable Override Examples

```json
{
  "overrides": [
    {
      "title": "AWS Certified Solutions Architect – Professional",
      "priority": 10
    },
    {
      "title": "Azure Solutions Architect Expert",
      "priority": 10
    },
    {
      "title": "MTA: Networking Fundamentals",
      "displayed": false,
      "includeInCount": false
    },
    {
      "title": "Windows 7",
      "displayed": false,
      "includeInCount": true
    },
    {
      "title": "AWS Partner: Generative AI Essentials",
      "displayed": true,
      "includeInCount": false
    }
  ]
}
```

---

## 3. Adding Non-Credly Credentials (`manual-certifications.json`)

To add credentials not hosted on Credly or Microsoft Learn (e.g. Linux Foundation CKA, university degrees, Cisco, etc.), add them to the `certifications` array in `src/content/cv/manual-certifications.json`:

```json
{
  "certifications": [
    {
      "id": "cka-kubernetes",
      "title": "Certified Kubernetes Administrator (CKA)",
      "issuer": "Linux Foundation",
      "issueDate": "Mar 2025",
      "expiresDate": "Mar 2028",
      "badgeImageUrl": "https://images.credly.com/images/8b8e6f12-25e2-45e0-82d2-e5b1580235b3/kubernetes-administrator-cka.png",
      "verifyUrl": "https://www.credly.com/org/the-linux-foundation/badge/certified-kubernetes-administrator-cka",
      "displayed": true,
      "includeInCount": true,
      "priority": 10
    }
  ]
}
```

---

## 4. Managing via Pages CMS Browser GUI

Both configuration files are registered in `.pages.yml`:
1. **Non-Credly Credentials**: In Pages CMS, click "Non-Credly Credentials" to add new certifications with direct inputs for title, issuer, dates, `badgeImageUrl`, `verifyUrl`, `displayed`, `includeInCount`, and `priority`.
2. **Credential Visibility & Count Toggles**: Click "Credential Visibility & Count Toggles" to adjust toggles and priorities with a graphical interface.
