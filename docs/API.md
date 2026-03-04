# API Reference

TypeScript API documentation for monica-cli.

## Installation

```bash
bun add monica-cli
```

## Configuration

```typescript
import { setConfig } from 'monica-cli';

setConfig({
  apiUrl: 'https://your-instance.com/api',
  apiKey: 'your-jwt-token',
});
```

Or use environment variables:

```bash
MONICA_API_URL=https://your-instance.com/api
MONICA_API_KEY=your-jwt-token
```

## Client

### getConfig()

Get current configuration.

```typescript
import { getConfig } from 'monica-cli';

const config = getConfig();
// { apiUrl: string, apiKey: string, ... }
```

### setConfig(config)

Set configuration programmatically.

```typescript
import { setConfig } from 'monica-cli';

setConfig({
  apiUrl: 'https://example.com/api',
  apiKey: 'token',
});
```

### MonicaApiError

Custom error class for API errors.

```typescript
import { MonicaApiError } from 'monica-cli';

try {
  await getContact(999);
} catch (error) {
  if (error instanceof MonicaApiError) {
    console.log(error.message);     // Error message
    console.log(error.errorCode);   // Monica error code
    console.log(error.statusCode);  // HTTP status code
  }
}
```

### Pagination Helpers

```typescript
import { paginate, getAllPages } from 'monica-cli';

// Async generator for pagination
for await (const contacts of paginate<Contact>('/contacts')) {
  console.log(contacts);
}

// Fetch all pages at once
const allContacts = await getAllPages<Contact>('/contacts');
```

## Contacts API

```typescript
import {
  listContacts,
  listAllContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  searchContacts,
  updateContactCareer,
  getContactLogs,
  getContactFields,
} from 'monica-cli';

// List contacts (paginated)
const result = await listContacts({ page: 1, limit: 10, query: 'john' });

// List all contacts
const contacts = await listAllContacts();

// Get a contact
const contact = await getContact(1);
console.log(contact.data);

// Get with contact fields
const contactWithFields = await getContact(1, 'contactfields');

// Create a contact
const newContact = await createContact({
  first_name: 'John',
  last_name: 'Doe',
  gender_id: 1,
  is_birthdate_known: false,
  is_deceased: false,
  is_deceased_date_known: false,
  is_partial: false,
});

// Update a contact
const updated = await updateContact(1, {
  first_name: 'Jane',
  gender_id: 1,
  is_birthdate_known: false,
  is_deceased: false,
  is_deceased_date_known: false,
});

// Delete a contact
await deleteContact(1);

// Search contacts
const results = await searchContacts('john');

// Update career
await updateContactCareer(1, { job: 'Developer', company: 'Acme' });

// Get audit logs
const logs = await getContactLogs(1);

// Get contact fields
const fields = await getContactFields(1);
```

## Activities API

```typescript
import {
  listActivities,
  listAllActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  listContactActivities,
} from 'monica-cli';

// List activities
const activities = await listActivities({ page: 1, limit: 10 });

// Get activity
const activity = await getActivity(1);

// Create activity
const newActivity = await createActivity({
  activity_type_id: 1,
  summary: 'Lunch meeting',
  description: 'Discussed project timeline',
  happened_at: '2024-01-15',
  contacts: [1, 2],
});

// Update activity
await updateActivity(1, {
  activity_type_id: 1,
  summary: 'Updated summary',
  happened_at: '2024-01-15',
  contacts: [1],
});

// Delete activity
await deleteActivity(1);

// List contact's activities
const contactActivities = await listContactActivities(1);
```

## Notes API

```typescript
import {
  listNotes,
  listAllNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  listContactNotes,
} from 'monica-cli';

// Create note
const note = await createNote({
  body: 'Note content',
  contact_id: 1,
  is_favorited: 0,
});

// Update note
await updateNote(1, {
  body: 'Updated content',
  contact_id: 1,
  is_favorited: 1,
});
```

## Tasks API

```typescript
import {
  listTasks,
  listAllTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  listContactTasks,
} from 'monica-cli';

// Create task
const task = await createTask({
  title: 'Call John',
  description: 'Discuss quarterly report',
  completed: 0,
  contact_id: 1,
});

// Update task
await updateTask(1, {
  title: 'Updated title',
  completed: 1,
  completed_at: '2024-01-15',
  contact_id: 1,
});
```

## Reminders API

```typescript
import {
  listReminders,
  listAllReminders,
  getReminder,
  createReminder,
  updateReminder,
  deleteReminder,
  listContactReminders,
} from 'monica-cli';

// Create reminder
const reminder = await createReminder({
  title: 'Birthday reminder',
  description: 'Remember to send a card',
  next_expected_date: '2024-06-15',
  frequency_type: 'year',
  frequency_number: 1,
  contact_id: 1,
});
```

## Tags API

```typescript
import {
  listTags,
  listAllTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
  setContactTags,
  unsetContactTag,
  unsetAllContactTags,
  listContactsByTag,
} from 'monica-cli';

// Create tag
const tag = await createTag({ name: 'family' });

// Set tags on contact (creates tags if needed)
await setContactTags(1, { tags: ['family', 'friend'] });

// Remove specific tag
await unsetContactTag(1, { tags: [1, 2] });

// Remove all tags
await unsetAllContactTags(1);

// List contacts by tag
const contacts = await listContactsByTag(1);
```

## Companies API

```typescript
import {
  listCompanies,
  listAllCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
} from 'monica-cli';

// Create company
const company = await createCompany({
  name: 'Acme Corp',
  website: 'https://acme.com',
  number_of_employees: 100,
});
```

## Calls API

```typescript
import {
  listCalls,
  listAllCalls,
  getCall,
  createCall,
  updateCall,
  deleteCall,
  listContactCalls,
} from 'monica-cli';

// Create call
const call = await createCall({
  contact_id: 1,
  content: 'Discussed project timeline',
  called_at: '2024-01-15',
});

// Update call
await updateCall(1, {
  content: 'Updated notes',
  called_at: '2024-01-15',
});
```

## Photos API

```typescript
import {
  listPhotos,
  listAllPhotos,
  getPhoto,
  deletePhoto,
  listContactPhotos,
} from 'monica-cli';

// List photos
const photos = await listPhotos({ page: 1, limit: 10 });

// List contact's photos
const contactPhotos = await listContactPhotos(1);

// Get photo
const photo = await getPhoto(1);

// Delete photo
await deletePhoto(1);
```

## Documents API

```typescript
import {
  listDocuments,
  listAllDocuments,
  getDocument,
  deleteDocument,
  listContactDocuments,
} from 'monica-cli';

// List documents
const documents = await listDocuments({ page: 1, limit: 10 });

// List contact's documents
const contactDocs = await listContactDocuments(1);

// Get document
const doc = await getDocument(1);

// Delete document
await deleteDocument(1);
```

## Gifts API

```typescript
import {
  listGifts,
  listAllGifts,
  getGift,
  createGift,
  updateGift,
  deleteGift,
  listContactGifts,
  associateGiftPhoto,
} from 'monica-cli';

// Create gift
const gift = await createGift({
  name: 'Birthday present',
  comment: 'A nice book',
  status: 'idea',
  contact_id: 1,
});
```

## Debts API

```typescript
import {
  listDebts,
  listAllDebts,
  getDebt,
  createDebt,
  updateDebt,
  deleteDebt,
} from 'monica-cli';

// Create debt
const debt = await createDebt({
  contact_id: 1,
  in_debt: 'yes',  // 'yes' = user owes contact
  status: 'inprogress',
  amount: 100,
  reason: 'Lunch money',
});
```

## Addresses API

```typescript
import {
  listAddresses,
  listAllAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  listContactAddresses,
} from 'monica-cli';

// Create address
const address = await createAddress({
  contact_id: 1,
  name: 'Home',
  street: '123 Main St',
  city: 'New York',
  province: 'NY',
  postal_code: '10001',
  country_id: 'US',
});
```

## Journal API

```typescript
import {
  listJournalEntries,
  listAllJournalEntries,
  getJournalEntry,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} from 'monica-cli';

// Create entry
const entry = await createJournalEntry({
  title: 'Today\'s thoughts',
  post: 'Long content here...',
});
```

## Groups API

```typescript
import {
  listGroups,
  listAllGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
} from 'monica-cli';

// Create group
const group = await createGroup({ name: 'Close friends' });
```

## Occupations API

```typescript
import {
  listOccupations,
  listAllOccupations,
  getOccupation,
  createOccupation,
  updateOccupation,
  deleteOccupation,
  listContactOccupations,
} from 'monica-cli';

// Create occupation
const occupation = await createOccupation({
  contact_id: 1,
  company_id: 1,
  title: 'Software Engineer',
  description: 'Full-stack development',
  salary: 100000,
  salary_unit: 'year',
  currently_works_here: true,
  start_date: '2020-01-15',
});
```

## Conversations API

```typescript
import {
  listConversations,
  listAllConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  listContactConversations,
} from 'monica-cli';

// Create conversation
const conversation = await createConversation({
  contact_id: 1,
  contact_field_type_id: 1,
  happened_at: '2024-01-15',
});
```

## Relationships API

```typescript
import {
  getRelationship,
  createRelationship,
  deleteRelationship,
  listRelationships,
  listRelationshipTypes,
  getRelationshipType,
  listRelationshipTypeGroups,
  getRelationshipTypeGroup,
} from 'monica-cli';

// Create relationship
const relationship = await createRelationship({
  contact_is: 1,         // Primary contact
  of_contact: 2,         // Related contact
  relationship_type_id: 1,
});

// List relationships for contact
const relationships = await listRelationships(1);

// Get a specific relationship type group
const group = await getRelationshipTypeGroup(1);
```

## Pets API

```typescript
import {
  listPets,
  listAllPets,
  listContactPets,
  getPet,
  createPet,
  updatePet,
  deletePet,
} from 'monica-cli';

// List pets (paginated)
const result = await listPets({ page: 1, limit: 10 });

// List all pets
const allPets = await listAllPets();

// List pets for a specific contact
const contactPets = await listContactPets(1);

// Get a specific pet
const pet = await getPet(1);
console.log(pet.data);

// Create a pet
const newPet = await createPet({
  contact_id: 1,
  name: 'Fluffy',
  pet_category_id: 1,
});

// Update a pet
await updatePet(1, {
  name: 'Updated name',
  pet_category_id: 2,
});

// Delete a pet
await deletePet(1);
```

## Reference API

```typescript
import {
  getUser,
  listGenders,
  getGender,
  createGender,
  updateGender,
  deleteGender,
  listCountries,
  listCurrencies,
  getCurrency,
  listActivityTypes,
  getActivityType,
  createActivityType,
  updateActivityType,
  deleteActivityType,
  listActivityTypeCategories,
  getActivityTypeCategory,
  createActivityTypeCategory,
  updateActivityTypeCategory,
  deleteActivityTypeCategory,
  listContactFieldTypes,
  getContactFieldType,
  createContactFieldType,
  updateContactFieldType,
  deleteContactFieldType,
  listContactFields,
  getContactField,
  createContactField,
  updateContactField,
  deleteContactField,
  listCompliance,
  getCompliance,
  getUserComplianceStatus,
  getUserComplianceStatusForTerm,
  signCompliance,
  listAuditLogs,
} from 'monica-cli';

// Get current user
const user = await getUser();

// List genders
const genders = await listGenders();

// List countries
const countries = await listCountries();

// List currencies
const currencies = await listCurrencies();

// List activity types
const activityTypes = await listActivityTypes();

// List audit logs
const auditLogs = await listAuditLogs({ page: 1, limit: 50 });
```

## Types

All types are exported from the main module:

```typescript
import type {
  Contact,
  ContactCreateInput,
  ContactUpdateInput,
  Activity,
  ActivityCreateInput,
  Note,
  NoteCreateInput,
  Task,
  TaskCreateInput,
  Reminder,
  ReminderCreateInput,
  Tag,
  TagCreateInput,
  Company,
  CompanyCreateInput,
  Call,
  CallCreateInput,
  Photo,
  Document,
  Gift,
  GiftCreateInput,
  Debt,
  DebtCreateInput,
  Address,
  AddressCreateInput,
  JournalEntry,
  JournalCreateInput,
  Group,
  GroupCreateInput,
  Occupation,
  OccupationCreateInput,
  Conversation,
  ConversationCreateInput,
  Relationship,
  RelationshipCreateInput,
  Pet,
  PetCreateInput,
  PetUpdateInput,
  PetCategory,
  Gender,
  Country,
  Currency,
  ActivityType,
  ActivityTypeCategory,
  ContactFieldType,
  ContactField,
  AuditLog,
  User,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
  OutputFormat,
} from 'monica-cli';
```

## Formatters

```typescript
import {
  formatOutput,
  formatPaginatedResponse,
  formatError,
  formatSuccess,
  formatDeleted,
  ContactFields,
  ActivityFields,
  NoteFields,
  TaskFields,
  ReminderFields,
  TagFields,
  CompanyFields,
} from 'monica-cli';

// Format output
const output = formatOutput(data, 'toon');  // or 'json' or 'table'

// Format paginated response
const formatted = formatPaginatedResponse(response, 'toon', ['id', 'name']);

// Format error
console.error(formatError(new Error('Something went wrong')));

// Format success
console.log(formatSuccess('Contact created', 123));

// Format deleted
console.log(formatDeleted(123));
```
