# Database Schemas — JobMatch AI

MongoDB database: `jobmatch`

---

## Collection: `users`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated primary key |
| `name` | String | User's display name (2–50 chars) |
| `email` | String | Unique, lowercase, indexed |
| `password` | String | bcrypt hashed (12 rounds), never returned |
| `role` | String | `"user"` or `"admin"` |
| `isActive` | Boolean | Soft deactivation flag |
| `lastLogin` | Date | Timestamp of last login |
| `createdAt` | Date | Auto-managed by Mongoose |
| `updatedAt` | Date | Auto-managed by Mongoose |

---

## Collection: `resumes`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated |
| `userId` | ObjectId | Reference to `users._id` |
| `filename` | String | UUID-based server filename |
| `originalName` | String | Original upload filename |
| `filePath` | String | Disk path (not exposed to client) |
| `fileSize` | Number | Bytes |
| `mimeType` | String | `application/pdf` or `text/plain` |
| `extractedText` | String | Full extracted text content |
| `wordCount` | Number | Word count of extracted text |
| `isActive` | Boolean | Soft delete flag |
| `createdAt` | Date | Auto-managed |
| `updatedAt` | Date | Auto-managed |

**Indexes:**
- `{ userId: 1, createdAt: -1 }`

---

## Collection: `scoringresults`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated |
| `userId` | ObjectId | Reference to `users._id` |
| `resumeId` | ObjectId | Reference to `resumes._id` |
| `jobDescription` | String | Full JD text (min 50 chars) |
| `jobTitle` | String | Optional job title |
| `company` | String | Optional company name |
| `similarityScore` | Number | Final weighted score 0–100 |
| `semanticScore` | Number | SBERT component score 0–100 |
| `skillScore` | Number | Skill overlap component 0–100 |
| `experienceScore` | Number | Experience alignment 0–100 |
| `matchedSkills` | [String] | Skills present in both resume & JD |
| `missingSkills` | [String] | Skills required but absent |
| `semanticInsights.strongMatches` | [String] | Described strong alignment areas |
| `semanticInsights.partialMatches` | [String] | Partial/semantic skill matches |
| `semanticInsights.gaps` | [String] | Described gap areas |
| `analysis` | String | Full human-readable explanation |
| `scoreCategory` | String | `Excellent/Good/Fair/Poor` (derived) |
| `processingTimeMs` | Number | NLP processing duration |
| `nlpModelVersion` | String | Model version tag |
| `createdAt` | Date | Auto-managed |
| `updatedAt` | Date | Auto-managed |

**Indexes:**
- `{ userId: 1, createdAt: -1 }`
- `{ userId: 1, similarityScore: -1 }`

---

## Scoring Formula

```
Final Score = (semanticScore × 0.40) + (skillScore × 0.40) + (experienceScore × 0.20)
```

Score categories:
- **Excellent**: ≥ 80
- **Good**: 65–79
- **Fair**: 45–64
- **Poor**: < 45

---

## ER Diagram

```
users ──────────────────────┐
  _id ◄──── userId          │
  name                      │
  email                     │
  password              resumes
  role                    _id ◄──── resumeId
  isActive                userId ──► users._id
  lastLogin               originalName
                          extractedText
                          wordCount
                              │
                              ▼
                       scoringresults
                          _id
                          userId ──► users._id
                          resumeId ──► resumes._id
                          jobDescription
                          similarityScore
                          matchedSkills[]
                          missingSkills[]
                          semanticInsights{}
                          analysis
```
