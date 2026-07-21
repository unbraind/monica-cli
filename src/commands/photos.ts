import type { Photo } from '../types';
import * as api from '../api';
import { createAttachmentCommand } from './attachment-command';

/** Build the photo attachment command family. */
export function createPhotosCommand() {
  return createAttachmentCommand<Photo>({
    name: 'photos',
    singular: 'photo',
    fields: ['id', 'original_filename', 'filesize', 'mime_type', 'created_at'],
    listPage: api.listPhotos,
    listAll: () => api.listAllPhotos(),
    get: api.getPhoto,
    remove: api.deletePhoto,
    upload: api.createPhoto,
  });
}
