import TmpyFile from './tmpy-file';

export interface TmpyFileZipStartAction {
  readonly type: 'tmpy-file-zip-start';
  readonly data: { readonly tmpyFileId: number };
}

export interface TmpyFileZipProgressAction {
  readonly type: 'tmpy-file-zip-progress';
  readonly data: {
    readonly tmpyFileId: number,
    readonly percent: number,
    readonly currentFile: string | null
  };
}

export interface TmpyFileZipCompleteAction {
  readonly type: 'tmpy-file-zip-complete';
  readonly data: {
    readonly tmpyFileId: number,
    readonly buffer: ArrayBuffer
  }
}

export interface TmpyFileUploadQueueAction {
  readonly type: 'tmpy-file-upload-queue';
  readonly data: {
    readonly tmpyFiles: TmpyFile[]
  };
}

export interface TmpyFileUploadStartAction {
  readonly type: 'tmpy-file-upload-start';
  readonly data: {
    readonly tmpyFileIds: number[]
  };
}

export interface TmpyFileUploadProgressAction {
  readonly type: 'tmpy-file-upload-progress';
  readonly data: {
    readonly tmpyFileId: number,
    readonly total: number,
    readonly loaded: number
  };
}

export interface TmpyFileUploadCompleteAction {
  readonly type: 'tmpy-file-upload-complete';
  readonly data: {
    tmpyFileId: number,
    url: string
  };
}

export type TMPY_CLIENT_ACTIONS =
  TmpyFileUploadQueueAction |
  TmpyFileZipProgressAction |
  TmpyFileZipStartAction |
  TmpyFileZipCompleteAction |
  TmpyFileUploadStartAction |
  TmpyFileUploadProgressAction |
  TmpyFileUploadCompleteAction;
