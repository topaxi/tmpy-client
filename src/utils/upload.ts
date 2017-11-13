import { dict } from './dict';

let globalQueue: Upload[] = []
let uploadCount = 0
let fileId      = 0

export function upload(files: File | File[], config?: any): Upload | Upload[] {
  if (Array.isArray(files)) {
    return Array.from(files, up)
  }

  return up(files)

  function up(file: File): Upload {
    return new Upload(file, config).send()
  }
}

class ChunkMeta {
  constructor(
    public loaded: number,
    public total: number,
    public number: number,
    public percent: number
  ) {}
}

export class UploadProgressEvent {
  public originalEvent: ProgressEvent;
  public lengthComputable: boolean;
  public currentTarget: EventTarget;
  public loaded: number;
  public position: number;
  public target: EventTarget;
  public timeStamp: number;
  public file: File;
  public total: number;
  public totalSize: number;
  public chunk: ChunkMeta;
  public percent: number;

  constructor(e: ProgressEvent, up: Upload) {
    this.originalEvent    = e
    this.lengthComputable = e.lengthComputable
    this.currentTarget    = e.currentTarget
    this.loaded           = up.chunkNumber * up.chunkSize + up.chunkLoaded
    this.position         = this.loaded
    this.target           = e.target
    this.timeStamp        = e.timeStamp
    this.file             = up.file
    this.total            = up.file.size
    this.totalSize        = e.total
    this.chunk            = new ChunkMeta(
                              up.chunkLoaded,
                              up.chunkTotal,
                              up.chunkNumber,
                              100 / up.chunkTotal * up.chunkLoaded
                            )
    this.percent          = 100 / this.total * this.loaded
  }
}

export interface UploadOptions {
  fileName?: string;
  target?: string;
  chunkSize?: number;
  accept?: string;
  method?: string;
  chunking?: boolean;
  data?: { [key: string]: any };
  prependQueue?: boolean;
  processResponse?: (xhr: XMLHttpRequest) => any;
  start?(): void;
  progress?(e: UploadProgressEvent): void;
  done?(res: any): void;
}

type EventCallback = (this: Upload, ...args: any[]) => void;

export default class Upload {
  static upload          = upload
  static target          = '/upload'
  static method          = 'post'
  static fileName        = 'file'
  static max             = 4
  static chunking        = true
  static chunkSize       = 2 * 1024 * 1024
  static accept          = 'application/json'
  static processResponse = (xhr: XMLHttpRequest) => xhr

  private fileId: number;
  private fileName: string;
  private target: string;
  private accept: string;
  private method: string;
  private events = dict<EventCallback[]>();
  private xhr: XMLHttpRequest | null = null; // the current XMLHttpRequest
  private chunking: boolean;
  private chunks: number;
  private data: { [key: string]: any } | null;
  private prependQueue: boolean;
  private processResponse: (xhr: XMLHttpRequest) => any;

  public file: File;
  public chunkSize: number = 0;
  public chunkLoaded: number = 0;
  public chunkTotal: number = 0;
  public chunkNumber: number = 0;

  constructor(file: File, config: UploadOptions = {}) {
    this.fileId          = ++fileId
    this.file            = file
    this.fileName        = config.fileName  || Upload.fileName
    this.target          = config.target    || Upload.target
    this.chunkSize       = config.chunkSize || Upload.chunkSize
    this.accept          = config.accept    || Upload.accept
    this.method          = config.method    || Upload.method
    this.chunking        = config.chunking != null ? config.chunking : Upload.chunking
    this.chunks          = this.countChunks()
    this.data            = config.data || null // additional data to be uploaded
    this.prependQueue    = !!config.prependQueue
    this.processResponse = config.processResponse || Upload.processResponse

    if (typeof config == 'function') {
      this.on('start', config)
    }

    if (config.start)    this.once('start',    config.start   )
    if (config.progress) this.on  ('progress', config.progress)
    if (config.done)     this.once('done',     config.done    )
  }

  then(success: any, error?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.once('done', resolve)
      this.once('error', reject)
    })
    .then(success, error)
  }

  send(method?: string): Upload {
    if (method) this.method = method

    if (uploadCount >= Upload.max) {
      globalQueue[this.prependQueue ? 'unshift' : 'push'](this)

      return this
    }

    uploadCount++

    this.onbeforesend(() => {
      this.chunks      = this.chunking === true ? this.countChunks() : 1
      this.chunkNumber = 0
      this._sendChunk()

      this.trigger('start')
    })

    return this
  }
  countChunks(): number {
    return this.chunks = Math.ceil(this.file.size / this.chunkSize)
  }
  private _sendChunk(): void {
    let form   = new FormData
    let xhr    = this.xhr = new XMLHttpRequest
    let upload = xhr.upload === undefined ? xhr : xhr.upload
    let chunk  = this.chunking === true
      ? sliceFile(this.file, this.chunkNumber, this.chunkSize)
      : this.file

    if (this.chunking === true) {
      form.append('first', this.chunkNumber == 0 ? '1' : '0')
      form.append('last',  this.chunkNumber == this.chunks - 1 ? '1' : '0')
    }

    if (this.data !== null) {
      for (let i in this.data) {
        form.append(i, this.data[i])
      }
    }

    form.append(this.fileName, chunk, this.file.name)

    xhr.open(this.method, this.target, true)
    xhr.setRequestHeader('Accept', this.accept)
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')

    upload.onprogress = progress(this._progress, this)

    xhr.onreadystatechange = ready(this._ready, this)
    xhr.onerror = (e: ErrorEvent) => this.trigger('error', e)

    xhr.send(form)
  }
  private _progress(e: ProgressEvent, chunkLoaded: number, chunkTotal: number): void {
    this.chunkLoaded = chunkLoaded
    this.chunkTotal  = chunkTotal

    this.trigger('progress', new UploadProgressEvent(e, this))
  }
  private _ready(): void {
    let res = this.processResponse(this.xhr!)

    if (this.chunkNumber == this.chunks - 1) {
      this.trigger('ready', res)
      this.trigger('done',  res)

      this.chunkLoaded = this.chunkTotal = 0
      this.xhr = null

      fileDone()
    }
    else {
      this.trigger('ready',      res)
      this.trigger('chunk done', res)
      this.chunkNumber++
      this._sendChunk()
    }
  }
  post(): Upload {
    return this.send('post')
  }
  put(): Upload {
    return this.send('put')
  }
  trigger(e: string, ...args: any[]): Upload {
    if (Array.isArray(this.events[e])) {
      this.events[e].forEach(handler =>
        handler.apply(this, args)
      )
    }

    return this
  }
  on(e: string, handler: EventCallback): Upload {
    if (!Array.isArray(this.events[e])) {
      this.events[e] = [ handler ]

      return this
    }

    this.events[e].push(handler)

    return this
  }
  off(e: string, handler: EventCallback): Upload {
    if (!Array.isArray(this.events[e])) return this

    if (!handler) {
      this.events[e] = []

      return this
    }

    let i = this.events[e].indexOf(handler)

    if (i >= 0) this.events[e].splice(i, 1)

    return this
  }
  once(e: string, handler: EventCallback): void {
    this.on(e, function() {
      handler.apply(this, arguments)

      this.off(e, handler)
    })
  }
  onbeforesend(callback: Function): void {
    callback()
  }
}

function sliceFile(file: File, from: number, size: number): Blob {
  return file.slice(from * size, from * size + size, file.type)
}

function fileDone(): void {
  uploadCount--

  if (globalQueue.length) {
    globalQueue.shift()!.send()
  }
}

function ready(fun: Function, self: Upload): (this: XMLHttpRequest) => void {
  return function() {
    if (this.readyState == 3) fun.apply(self, arguments)
  }
}

function progress(fun: Function, self: Upload): (e: ProgressEvent) => void {
  return e => {
    fun.call(self, e, e.loaded, e.total)
  }
}
