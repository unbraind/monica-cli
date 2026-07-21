import type { Document } from '../types';
import * as api from '../api';
import { createAttachmentCommand } from './attachment-command';

/** Build the document attachment command family. */
export function createDocumentsCommand() {
  return createAttachmentCommand<Document>({
    name: 'documents',
    singular: 'document',
    fields: ['id', 'name', 'original_filename', 'filesize', 'type', 'created_at'],
    listPage: api.listDocuments,
    listAll: () => api.listAllDocuments(),
    get: api.getDocument,
    remove: api.deleteDocument,
    upload: api.createDocument,
  });
}
