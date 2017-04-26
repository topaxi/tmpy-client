import TmpyFile from './tmpy-file';

export interface TmpyFileLoadStartAction {
  readonly type: 'tmpy-file-load-start';
  readonly data: { readonly tmpyFileId: string };
}

export interface TmpyFileLoadProgressAction {
  readonly type: 'tmpy-file-load-progress';
  readonly data: {
    readonly tmpyFileId: string,
    readonly currentFile: string,
    readonly total: number,
    readonly loaded: number
  };
}

export interface TmpyFileLoadCompleteAction {
  readonly type: 'tmpy-file-load-complete';
  readonly data: {
    readonly tmpyFileId: string
  }
}

export interface TmpyFileZipStartAction {
  readonly type: 'tmpy-file-zip-start';
  readonly data: { readonly tmpyFileId: string };
}

export interface TmpyFileZipProgressAction {
  readonly type: 'tmpy-file-zip-progress';
  readonly data: {
    readonly tmpyFileId: string,
    readonly percent: number,
    readonly currentFile: string | null
  };
}

export interface TmpyFileZipCompleteAction {
  readonly type: 'tmpy-file-zip-complete';
  readonly data: {
    readonly tmpyFileId: string,
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
    readonly tmpyFileIds: string[]
  };
}

export interface TmpyFileUploadProgressAction {
  readonly type: 'tmpy-file-upload-progress';
  readonly data: {
    readonly tmpyFileId: string,
    readonly total: number,
    readonly loaded: number
  };
}

export interface TmpyFileUploadCompleteAction {
  readonly type: 'tmpy-file-upload-complete';
  readonly data: {
    tmpyFileId: string,
    url: string
  };
}

export interface TmpyFileRemoveAction {
  readonly type: 'tmpy-file-remove';
  readonly data: TmpyFile[];
}

export type TMPY_CLIENT_ACTIONS =
  TmpyFileUploadQueueAction |
  TmpyFileLoadProgressAction |
  TmpyFileLoadStartAction |
  TmpyFileLoadCompleteAction |
  TmpyFileZipProgressAction |
  TmpyFileZipStartAction |
  TmpyFileZipCompleteAction |
  TmpyFileUploadStartAction |
  TmpyFileUploadProgressAction |
  TmpyFileUploadCompleteAction |
  TmpyFileRemoveAction;
